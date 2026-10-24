import { gzipSync } from "node:zlib";
import { transform } from "lightningcss";
import { targets } from "./css-targets";

/** Bytes of a sheet after minifying, and after gzip on top. */
export type Size = { min: number; gzip: number };

const METRICS = ["min", "gzip"] as const;
type Metric = (typeof METRICS)[number];

/**
 * The shipped size of a compiled sheet: the Lightning CSS pass that
 * `build:css` and release run, then gzip. It takes Sass's expanded output,
 * which keeps a few spaces inside `calc()` that Sass's compressed style
 * drops, so it reads under 100 bytes over the shipped size.
 */
export function measureCss(css: string, filename: string): Size {
  const { code } = transform({
    filename,
    code: Buffer.from(css, "utf8"),
    targets,
    minify: true,
  });
  return { min: code.byteLength, gzip: gzipSync(code).byteLength };
}

/** The sheets `check:css:size` guards. */
export const GUARDED_ENTRIES = ["all", "white"];

/**
 * How much one PR may grow each guarded sheet. The biggest feature PR so
 * far, the CSS Grid module (#4083), adds 18.7 kB min and 2.1 kB gzip.
 * Undoing one pruning commit (7e301af6f, legacy Carbon selectors) adds
 * 34.1 kB and 3.3 kB, and a re-synced vendored file far more.
 */
export const GROWTH_LIMIT: Size = { min: 25_000, gzip: 3_000 };

/** The commit trailer that raises the limit for one PR. */
export const ALLOWANCE_TRAILER = "CSS-Size-Growth";

const PLACEHOLDER = "<why this PR needs it>";

export type Allowance = { limit: Partial<Size>; reason: string };

const AMOUNT = /(\d+(?:\.\d+)?)\s*kB\s+(min|gzip)\b/gi;

/**
 * Reads a `CSS-Size-Growth` trailer value: the limits, then a semicolon and
 * the reason, as in `6 kB gzip, 40 kB min; adds the v11 chart styles`.
 */
export function parseAllowance(value: string): Allowance | { error: string } {
  const split = value.indexOf(";");
  const amounts = split === -1 ? value : value.slice(0, split);
  const reason = split === -1 ? "" : value.slice(split + 1).trim();
  const limit: Partial<Size> = {};
  for (const [, number, metric] of amounts.matchAll(AMOUNT)) {
    const key = metric.toLowerCase() as Metric;
    limit[key] = Math.max(limit[key] ?? 0, Math.round(Number(number) * 1000));
  }
  if (Object.keys(limit).length === 0) {
    return { error: `no "<n> kB gzip" or "<n> kB min" in "${value}"` };
  }
  if (!reason || reason === PLACEHOLDER) {
    return { error: `no reason after ";" in "${value}"` };
  }
  return { limit, reason };
}

/** The per-sheet limit once a PR's allowances apply. */
export function growthLimit(allowances: Allowance[]): Size {
  const limit = { ...GROWTH_LIMIT };
  for (const { limit: raised } of allowances) {
    for (const metric of METRICS) {
      limit[metric] = Math.max(limit[metric], raised[metric] ?? 0);
    }
  }
  return limit;
}

export type Verdict = {
  entry: string;
  base: Size;
  head: Size;
  delta: Size;
  /** The metrics that grew past the limit. */
  over: Metric[];
};

export function judge(
  entry: string,
  base: Size,
  head: Size,
  limit: Size,
): Verdict {
  const delta = { min: head.min - base.min, gzip: head.gzip - base.gzip };
  const over = METRICS.filter((metric) => delta[metric] > limit[metric]);
  return { entry, base, head, delta, over };
}

/** `92.2 kB`, or `+2.1 kB` with `signed`. */
export function formatKB(bytes: number, signed = false): string {
  const kB = (bytes / 1000).toFixed(1);
  return signed && bytes >= 0 ? `+${kB} kB` : `${kB} kB`;
}

/** A trailer that would let `verdicts` pass, rounded up to whole kB. */
export function suggestAllowance(verdicts: Verdict[]): string {
  const amounts = METRICS.filter((metric) =>
    verdicts.some((verdict) => verdict.over.includes(metric)),
  ).map((metric) => {
    const most = Math.max(...verdicts.map((verdict) => verdict.delta[metric]));
    return `${Math.ceil(most / 1000)} kB ${metric}`;
  });
  return `${ALLOWANCE_TRAILER}: ${amounts.join(", ")}; ${PLACEHOLDER}`;
}
