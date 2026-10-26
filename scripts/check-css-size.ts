import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { compileAt } from "crassus/git";
import {
  type Allowance,
  ALLOWANCE_TRAILER,
  formatKB,
  GROWTH_LIMIT,
  growthLimit,
  GUARDED_ENTRIES,
  judge,
  measureCss,
  parseAllowance,
  type Size,
  suggestAllowance,
  type Verdict,
} from "./lib/css-size";

/**
 * Fails when this branch grows `all.css` or `white.css` by more than
 * `GROWTH_LIMIT` against its merge base with `--base`. A PR that needs more
 * says so in a `CSS-Size-Growth` commit trailer (see CONTRIBUTING, Size growth).
 *
 *   bun run check:css:size [--base origin/master] [--format github]
 *                          [--summary <file>] [--no-cache]
 *
 * Sizes are cached by the git tree of `css/` and the toolchain, so a base
 * is compiled once however many branches share it.
 */
const { values } = parseArgs({
  options: {
    base: { type: "string", default: "origin/master" },
    format: { type: "string", default: "human" },
    summary: { type: "string" },
    "no-cache": { type: "boolean", default: false },
  },
});
const BASE_REF = values.base as string;
const GITHUB = values.format === "github";

const ROOT = git("rev-parse", "--show-toplevel");
const CACHE_DIR = join(ROOT, "node_modules/.cache/ccs-css-size");

function git(...args: string[]): string {
  const result = spawnSync("git", args, { encoding: "utf-8" });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
  }
  return result.stdout.trim();
}

function version(pkg: string): string {
  const file = join(ROOT, "node_modules", pkg, "package.json");
  return JSON.parse(readFileSync(file, "utf-8")).version;
}

// What else decides a size besides the sources: the compile options, the
// measure and its browser targets, and the compiler versions.
const TOOLCHAIN = createHash("sha1")
  .update(version("sass-embedded"))
  .update(version("lightningcss"))
  .update(
    [
      "crassus.config.ts",
      "scripts/lib/css-size.ts",
      "scripts/lib/css-targets.ts",
    ]
      .map((file) => readFileSync(join(ROOT, file), "utf-8"))
      .join("\0"),
  )
  .digest("hex");

/** Sizes of the stylesheets at `rev`, or of the working tree. */
async function measure(rev?: string): Promise<Record<string, Size>> {
  const { sheets } = await compileAt(rev, {
    cwd: ROOT,
    entries: GUARDED_ENTRIES,
    cache: !values["no-cache"],
  });
  return Object.fromEntries(
    GUARDED_ENTRIES.map((entry) => [
      entry,
      measureCss(sheets[entry].css, `${entry}.css`),
    ]),
  );
}

const pending = new Map<string, Promise<Record<string, Size>>>();

/** Sizes at `rev`, or of the working tree when `rev` is undefined. */
function sizesAt(rev?: string): Promise<Record<string, Size>> {
  // The working tree has a tree hash only while css/ matches HEAD.
  const clean =
    rev !== undefined || git("status", "--porcelain", "--", "css") === "";
  if (!clean) return measure();
  const tree = git("rev-parse", `${rev ?? "HEAD"}:css`);
  const key = createHash("sha1").update(TOOLCHAIN).update(tree).digest("hex");
  // A branch that leaves css/ alone compiles it once for both sides.
  let sizes = pending.get(key);
  if (!sizes) {
    sizes = cachedSizes(key, rev ?? "HEAD");
    pending.set(key, sizes);
  }
  return sizes;
}

async function cachedSizes(
  key: string,
  rev: string,
): Promise<Record<string, Size>> {
  const cached = join(CACHE_DIR, `${key}.json`);
  if (!values["no-cache"] && existsSync(cached)) {
    return JSON.parse(readFileSync(cached, "utf-8"));
  }
  const sizes = await measure(rev);
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cached, JSON.stringify(sizes));
  return sizes;
}

/** The allowances in the trailers of this branch's commits. */
function allowances(mergeBase: string): {
  found: { commit: string; value: string; allowance: Allowance }[];
  errors: string[];
} {
  const log = git(
    "log",
    `--format=%h %s%x00%(trailers:key=${ALLOWANCE_TRAILER},valueonly,unfold)%x01`,
    `${mergeBase}..HEAD`,
  );
  const found = [];
  const errors = [];
  for (const record of log.split("\x01")) {
    const [commit, trailers = ""] = record.trim().split("\0");
    for (const value of trailers.split("\n").filter(Boolean)) {
      const allowance = parseAllowance(value.trim());
      if ("error" in allowance) {
        errors.push(`${commit}: ${ALLOWANCE_TRAILER} has ${allowance.error}`);
      } else found.push({ commit, value: value.trim(), allowance });
    }
  }
  return { found, errors };
}

function table(verdicts: Verdict[], limit: Size): string[] {
  const row = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [
    row(["Sheet", "Min", "Δ min", "Gzip", "Δ gzip", ""]),
    row(["---", "---:", "---:", "---:", "---:", "---"]),
    ...verdicts.map(({ entry, base, head, delta, over }) =>
      row([
        `${entry}.css`,
        `${formatKB(base.min)} → ${formatKB(head.min)}`,
        formatKB(delta.min, true),
        `${formatKB(base.gzip)} → ${formatKB(head.gzip)}`,
        formatKB(delta.gzip, true),
        over.length ? `over (${over.join(", ")})` : "ok",
      ]),
    ),
    "",
    `Limit per PR and sheet: ${formatKB(limit.min, true)} min, ${formatKB(limit.gzip, true)} gzip.`,
  ];
}

const mergeBase = git("merge-base", BASE_REF, "HEAD");
const started = performance.now();
const [base, head] = await Promise.all([sizesAt(mergeBase), sizesAt()]);
const { found, errors } = allowances(mergeBase);
const limit = growthLimit(found.map(({ allowance }) => allowance));
const verdicts = GUARDED_ENTRIES.map((entry) =>
  judge(entry, base[entry], head[entry], limit),
);
const failed = verdicts.filter((verdict) => verdict.over.length > 0);

const lines = [
  `CSS size against ${BASE_REF} (merge base ${mergeBase.slice(0, 9)}), ${Math.round(performance.now() - started)} ms`,
  "",
  ...table(verdicts, limit),
  ...(found.length || errors.length ? [""] : []),
  ...found.map(
    ({ commit, value }) =>
      `Raised by ${commit}: ${ALLOWANCE_TRAILER}: ${value}`,
  ),
  ...errors,
];
if (failed.length > 0) {
  lines.push(
    "",
    `A PR may grow each sheet by ${formatKB(GROWTH_LIMIT.min)} min and ${formatKB(GROWTH_LIMIT.gzip)} gzip.`,
    "Look for a bulk regression first: a re-synced vendored file, a family of selectors that lost its pruning.",
    "If the growth is intended, add this trailer to a commit message in the PR, and give the reason:",
    "",
    `    ${suggestAllowance(failed)}`,
  );
}
console.log(lines.join("\n"));

if (GITHUB) {
  for (const { entry, delta, over } of failed) {
    const metrics = over
      .map((metric) => `${formatKB(delta[metric], true)} ${metric}`)
      .join(", ");
    console.log(
      `::error title=CSS size::${entry}.css grew ${metrics}, over the per-PR limit. See the job summary.`,
    );
  }
  for (const error of errors) console.log(`::error title=CSS size::${error}`);
}
if (values.summary) {
  appendFileSync(
    values.summary,
    `## CSS size\n\n${lines
      .slice(2)
      .join("\n")
      .replace(/^ {4}(.+)$/m, "```\n$1\n```")}\n`,
  );
}
process.exit(failed.length > 0 || errors.length > 0 ? 1 : 0);
