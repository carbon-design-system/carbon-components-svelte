/**
 * Runs the dev tools' page checks (`audit` from `carbon-components-svelte/
 * devtools`) on every framed docs example and writes a report.
 *
 *   bun run audit:docs [--source docs|fixtures] [--carbon] [--width 1056]
 *     [--dir ltr] [--theme white] [--inspect selector] [--rhythm]
 *     [--filter Button]
 *     [--concurrency 4] [--base http://localhost:4175] [--out dir]
 *     [--include-seeded] [--baseline] [--update-baseline]
 *
 * Without `--base`, it serves `docs/dist` with `vite preview`; build it
 * first with `cd docs && bun run build:audit`. The audit is bundled from
 * source and injected into each page, so the docs need no changes.
 *
 * `--source fixtures` audits the e2e fixtures instead, served by the e2e
 * Vite config. `--inspect <selector>` adds `inspect()` of up to five
 * matching elements per page to the JSON report. `--rhythm` (experimental)
 * adds, per type style, how many lines sit at each offset from the 8px
 * baseline rows.
 *
 * `--width`, `--dir`, and `--theme` take comma lists, and every combination
 * runs: `--width 320,1056 --dir ltr,rtl --theme white,g100` is 8 variants.
 * Each finding names its variant, such as `320-rtl-g100`.
 *
 * With `--baseline`, it compares the findings with
 * `scripts/audit-docs.baseline[-carbon].json` and fails on any finding the
 * baseline does not list. `--update-baseline` rewrites the file and keeps
 * each entry's `reason`. CI runs the default mode with `--baseline`.
 */
import type { ChildProcess } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { type Browser, chromium } from "@playwright/test";
import {
  auditPage,
  bundleDevtools,
  componentsByBlock,
  type PageResult,
  pageUrls,
  ROOT,
  SEEDED,
  startServer,
  variantsOf,
} from "./lib/audit-pages";

function arg(name: string, fallback?: string) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : "true";
}

const list = (name: string, fallback: string) =>
  (arg(name, fallback) as string).split(",").map((value) => value.trim());

const carbon = arg("carbon") === "true";
const includeSeeded = arg("include-seeded") === "true";
const variants = variantsOf(
  list("width", "1056"),
  list("dir", "ltr"),
  list("theme", "white"),
);
const concurrency = Number(arg("concurrency", "4"));
const filter = arg("filter");
const inspect = arg("inspect");
const rhythm = arg("rhythm") === "true";
const compare = arg("baseline") === "true";
const updateBaseline = arg("update-baseline") === "true";
// `docs`: the framed docs examples. `fixtures`: the e2e fixtures, where
// new components get exercised; served by the e2e Vite config.
const source = arg("source", "docs") === "fixtures" ? "fixtures" : "docs";
const out = resolve(
  arg(
    "out",
    join(
      ROOT,
      source === "docs" ? ".context/audit-docs" : ".context/audit-fixtures",
    ),
  ) as string,
);
let base = arg("base");
const COMPONENTS = componentsByBlock();

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return (
    sorted[
      Math.min(sorted.length - 1, Math.floor((sorted.length * p) / 100))
    ] ?? 0
  );
}

function markdown(results: PageResult[], skipped: string[], wallMs: number) {
  const findings = results.flatMap((r) =>
    r.findings.map((f) => ({ ...f, url: r.url, variant: r.variant })),
  );
  const several = variants.length > 1;
  const total = findings.reduce((sum, f) => sum + (f.count ?? 1), 0);
  const byCheck = new Map<string, number>();
  const bySeverity = new Map<string, number>();
  for (const f of findings) {
    byCheck.set(f.check, (byCheck.get(f.check) ?? 0) + (f.count ?? 1));
    bySeverity.set(
      f.severity,
      (bySeverity.get(f.severity) ?? 0) + (f.count ?? 1),
    );
  }
  const byMessage = new Map<string, { count: number; pages: Set<string> }>();
  for (const f of findings) {
    const key = `${several ? `${f.variant} · ` : ""}${f.severity} · ${f.check} · ${f.component ?? f.carbon ?? "app"} · ${f.message}`;
    const entry = byMessage.get(key) ?? { count: 0, pages: new Set() };
    entry.count += f.count ?? 1;
    entry.pages.add(f.url);
    byMessage.set(key, entry);
  }
  const audits = results.filter((r) => !r.error).map((r) => r.auditMs);
  const loads = results.filter((r) => !r.error).map((r) => r.loadMs);
  const errors = results.filter((r) => r.error);
  const pages = results
    .filter((r) => r.findings.length)
    .sort((a, b) => b.findings.length - a.findings.length);
  return [
    `# Docs audit${carbon ? " (with Carbon)" : ""}`,
    "",
    `${results.length / variants.length} pages in ${variants.length} variant(s) (${variants.map((v) => v.id).join(", ")}), ${skipped.length} skipped as seeded demos, ${errors.length} errors. Wall time ${(wallMs / 1000).toFixed(1)}s with ${concurrency} pages at once.`,
    "",
    "| | p50 | p95 | max |",
    "| :--- | ---: | ---: | ---: |",
    `| audit() | ${percentile(audits, 50)}ms | ${percentile(audits, 95)}ms | ${Math.max(0, ...audits)}ms |`,
    `| load + settle | ${percentile(loads, 50)}ms | ${percentile(loads, 95)}ms | ${Math.max(0, ...loads)}ms |`,
    "",
    `## Findings: ${total} on ${pages.length} pages (${findings.length} after grouping)`,
    "",
    ...[...bySeverity].map(([severity, count]) => `- ${severity}: ${count}`),
    "",
    ...[...byCheck].map(([check, count]) => `- ${check}: ${count}`),
    ...(several
      ? [
          "",
          "| Variant | Findings | Pages |",
          "| :--- | ---: | ---: |",
          ...variants.map((v) => {
            const mine = findings.filter((f) => f.variant === v.id);
            return `| ${v.id} | ${mine.reduce((sum, f) => sum + (f.count ?? 1), 0)} | ${new Set(mine.map((f) => f.url)).size} |`;
          }),
        ]
      : []),
    "",
    "## Most common",
    "",
    "| Count | Pages | Finding |",
    "| ---: | ---: | :--- |",
    ...[...byMessage]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 40)
      .map(
        ([key, { count, pages }]) => `| ${count} | ${pages.size} | ${key} |`,
      ),
    "",
    "## Pages with the most findings",
    "",
    ...pages
      .slice(0, 30)
      .map(
        (r) =>
          `- ${r.url}${several ? ` (${r.variant})` : ""}: ${r.findings.length}`,
      ),
    ...(errors.length
      ? ["", "## Errors", "", ...errors.map((r) => `- ${r.url}: ${r.error}`)]
      : []),
    "",
  ].join("\n");
}

const all = pageUrls(source);
const skipped = includeSeeded
  ? []
  : all.filter((url) => SEEDED.some((re) => re.test(url)));
const urls = all.filter(
  (url) => !skipped.includes(url) && (!filter || url.includes(filter)),
);

let preview: ChildProcess | undefined;
if (!base) [base, preview] = await startServer(source);
const script = await bundleDevtools();
const browser: Browser = await chromium.launch();
const started = performance.now();
const results: PageResult[] = [];

for (const variant of variants) {
  const queue = [...urls];
  // biome-ignore lint/performance/noAwaitInLoops: one variant at a time, each with its own viewport
  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      const context = await browser.newContext({
        viewport: { width: variant.width, height: 800 },
      });
      const page = await context.newPage();
      for (let url = queue.shift(); url; url = queue.shift()) {
        // biome-ignore lint/performance/noAwaitInLoops: one page at a time per context
        const result = await auditPage(page, {
          base: base as string,
          url,
          script,
          variant,
          source,
          carbon,
          components: COMPONENTS,
          inspect,
          rhythm,
        });
        results.push(result);
      }
      await context.close();
    }),
  );
}

const wallMs = performance.now() - started;
await browser.close();
preview?.kill();

results.sort(
  (a, b) => a.url.localeCompare(b.url) || a.variant.localeCompare(b.variant),
);
mkdirSync(out, { recursive: true });
const suffix = carbon ? "-carbon" : "";
writeFileSync(
  join(out, `report${suffix}.json`),
  JSON.stringify({ variants, carbon, skipped, results }, null, 2),
);
// Findings only, without timings, to diff two runs.
writeFileSync(
  join(out, `findings${suffix}.json`),
  JSON.stringify(
    results.map((r) => ({
      url: r.url,
      variant: r.variant,
      error: r.error,
      findings: r.findings,
    })),
    null,
    2,
  ),
);
writeFileSync(
  join(out, `report${suffix}.md`),
  markdown(results, skipped, wallMs),
);
console.log(
  markdown(results, skipped, wallMs).split("\n").slice(0, 14).join("\n"),
);
console.log(`\nWrote ${relative(ROOT, out)}/report${suffix}.{json,md}`);

type BaselineEntry = {
  url: string;
  variant: string;
  check: string;
  selector: string;
  message: string;
  reason?: string;
};

const BASELINE = join(ROOT, `scripts/audit-${source}.baseline${suffix}.json`);
const keyOf = (e: Omit<BaselineEntry, "reason">) =>
  `${e.url}|${e.variant}|${e.check}|${e.selector}|${e.message}`;
// Pages and variants this run covered; baseline entries outside them stay.
const audited = new Set(results.map((r) => `${r.url}|${r.variant}`));
const covered = (e: BaselineEntry) => audited.has(`${e.url}|${e.variant}`);
const current: BaselineEntry[] = results.flatMap((r) =>
  r.findings.map((f) => ({
    url: r.url,
    variant: r.variant,
    check: f.check,
    selector: f.selector,
    message: f.message,
  })),
);

function readBaseline(): BaselineEntry[] {
  try {
    const entries: BaselineEntry[] = JSON.parse(
      readFileSync(BASELINE, "utf8"),
    ).findings;
    // Entries from before variants were recorded ran at 1056px, LTR, white.
    return entries.map((e) => ({ ...e, variant: e.variant ?? "1056" }));
  } catch {
    return [];
  }
}

let failed = results.some((r) => r.error);
if (failed) console.error("\nSome pages failed to load; see the report.");

if (updateBaseline) {
  const reasons = new Map(readBaseline().map((e) => [keyOf(e), e.reason]));
  const findings = [
    ...readBaseline().filter((e) => !covered(e)),
    ...current.map((e) => {
      const reason = reasons.get(keyOf(e));
      return reason ? { ...e, reason } : e;
    }),
  ].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
  writeFileSync(BASELINE, `${JSON.stringify({ carbon, findings }, null, 2)}\n`);
  console.log(
    `Wrote ${findings.length} findings to ${relative(ROOT, BASELINE)}`,
  );
} else if (compare) {
  const known = new Set(readBaseline().map(keyOf));
  const fresh = current.filter((e) => !known.has(keyOf(e)));
  const now = new Set(current.map(keyOf));
  const fixed = readBaseline().filter((e) => covered(e) && !now.has(keyOf(e)));
  if (fresh.length) {
    failed = true;
    console.error(
      `\n${fresh.length} new finding(s), not in ${relative(ROOT, BASELINE)}:`,
    );
    for (const e of fresh) {
      console.error(
        `  ${e.url} (${e.variant})  ${e.check}  ${e.message}\n    ${e.selector}`,
      );
    }
    console.error(
      "\nFix them, or accept them with `bun run audit:docs --update-baseline` and add a `reason`.",
    );
  }
  if (fixed.length) {
    console.log(
      `\n${fixed.length} baseline finding(s) are gone. Run \`bun run audit:docs --update-baseline\` to drop them.`,
    );
  }
  if (!fresh.length) console.log("\nNo new findings.");
}

process.exit(failed ? 1 : 0);
