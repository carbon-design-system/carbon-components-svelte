/**
 * Runs the dev tools' page checks (`audit` from `carbon-components-svelte/
 * devtools`) on every framed docs example and writes a report.
 *
 *   bun run audit:docs [--carbon] [--width 1056] [--dir ltr] [--theme white]
 *     [--filter Button]
 *     [--concurrency 4] [--base http://localhost:4175] [--out dir]
 *     [--include-seeded] [--baseline] [--update-baseline]
 *
 * Without `--base`, it serves `docs/dist` with `vite preview`; build it
 * first with `cd docs && bun run build:audit`. The audit is bundled from
 * source and injected into each page, so the docs need no changes.
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
import { type ChildProcess, spawn } from "node:child_process";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { type Browser, chromium, type Page } from "@playwright/test";

const ROOT = resolve(import.meta.dir, "..");
const SVELTE_FILE = /\.svelte$/;
const FIRST_BLOCK = /\bbx--([a-z0-9-]+)/;
const BEM_SEPARATOR = /__|--/;
const CAPITAL = /[A-Z]/g;
const FRAMED = join(ROOT, "docs/src/pages/framed");

// Dev tools demos seed layout bugs on purpose, and draw over the page.
const SEEDED = [
  /^\/framed\/LayoutInspector\//,
  /^\/framed\/DevToolbar\//,
  /^\/framed\/Grid\/GridOverlay/,
];

function arg(name: string, fallback?: string) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : "true";
}

const carbon = arg("carbon") === "true";
const includeSeeded = arg("include-seeded") === "true";
type Variant = {
  width: number;
  dir: "ltr" | "rtl";
  theme: string;
  id: string;
};

const list = (name: string, fallback: string) =>
  (arg(name, fallback) as string).split(",").map((value) => value.trim());
const variants: Variant[] = list("width", "1056").flatMap((width) =>
  list("dir", "ltr").flatMap((dir) =>
    list("theme", "white").map((theme) => ({
      width: Number(width),
      dir: dir === "rtl" ? ("rtl" as const) : ("ltr" as const),
      theme,
      id: `${width}${dir === "rtl" ? "-rtl" : ""}${theme === "white" ? "" : `-${theme}`}`,
    })),
  ),
);
const concurrency = Number(arg("concurrency", "4"));
const filter = arg("filter");
const compare = arg("baseline") === "true";
const updateBaseline = arg("update-baseline") === "true";
const out = resolve(arg("out", join(ROOT, ".context/audit-docs")) as string);
let base = arg("base");

function framedUrls(dir = FRAMED): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return framedUrls(path);
    if (!name.endsWith(".svelte") || name.startsWith("_")) return [];
    return [`/framed/${relative(FRAMED, path).replace(SVELTE_FILE, "")}`];
  });
}

/**
 * Likely component for each Carbon block, such as `bx--btn` for Button.
 * A component named after the block wins (`bx--data-table` is DataTable,
 * though Table's markup starts with it too); otherwise, the first
 * component whose markup starts with the block.
 */
function componentsByBlock() {
  const first = new Map<string, string>();
  const named = new Map<string, string>();
  const walk = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        if (name !== "devtools") walk(path);
        continue;
      }
      if (!name.endsWith(".svelte")) continue;
      const component = name.replace(SVELTE_FILE, "");
      const markup = readFileSync(path, "utf8").split("</script>").pop() ?? "";
      const kebab = `bx--${component.replace(CAPITAL, (c, i) => `${i ? "-" : ""}${c.toLowerCase()}`)}`;
      if (markup.includes(kebab)) named.set(kebab, component);
      const match = FIRST_BLOCK.exec(markup);
      if (!match) continue;
      const block = `bx--${match[1].split(BEM_SEPARATOR)[0]}`;
      if (!first.has(block)) first.set(block, component);
    }
  };
  walk(join(ROOT, "src"));
  return new Map([...first, ...named]);
}

const COMPONENTS = componentsByBlock();

async function bundleAudit() {
  const entry = join(tmpdir(), "ccs-audit-entry.js");
  writeFileSync(
    entry,
    `import { audit } from ${JSON.stringify(join(ROOT, "src/devtools/audit.js"))};\nwindow.__ccsAudit = audit;\n`,
  );
  const result = await Bun.build({
    entrypoints: [entry],
    format: "iife",
    minify: true,
  });
  if (!result.success) throw new Error(result.logs.join("\n"));
  return result.outputs[0].text();
}

async function startPreview(): Promise<[string, ChildProcess]> {
  const port = 4175;
  const child = spawn(
    "bunx",
    ["vite", "preview", "--port", String(port), "--strictPort"],
    {
      cwd: join(ROOT, "docs"),
      stdio: "ignore",
    },
  );
  const url = `http://localhost:${port}`;
  for (let i = 0; i < 100; i++) {
    try {
      // biome-ignore lint/performance/noAwaitInLoops: polls until the server answers
      if ((await fetch(url)).ok) return [url, child];
    } catch {}
    await Bun.sleep(100);
  }
  child.kill();
  throw new Error("vite preview did not start; is docs/dist built?");
}

/**
 * Waits for the route to render, the DOM to go quiet, fonts to load, and
 * transitions to end.
 */
async function settle(page: Page) {
  await page.waitForFunction(() => document.body.classList.contains("framed"));
  await page.evaluate(
    () =>
      new Promise<void>((done) => {
        const start = performance.now();
        let last = performance.now();
        const observer = new MutationObserver(() => {
          last = performance.now();
        });
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });
        const tick = () => {
          const now = performance.now();
          if (now - last > 100 || now - start > 2000) {
            observer.disconnect();
            // Transitions move boxes without touching the DOM; wait for the
            // ones that end, not for spinners that loop forever.
            const finite = document
              .getAnimations()
              .filter(
                (a) =>
                  a.effect?.getComputedTiming().endTime !==
                  Number.POSITIVE_INFINITY,
              )
              .map((a) => a.finished.catch(() => {}));
            Promise.race([
              Promise.all([document.fonts.ready, ...finite]),
              new Promise((r) => setTimeout(r, 2000)),
            ]).then(() =>
              requestAnimationFrame(() => requestAnimationFrame(() => done())),
            );
          } else {
            setTimeout(tick, 25);
          }
        };
        tick();
      }),
  );
}

type PageResult = {
  url: string;
  variant: string;
  findings: {
    check: string;
    severity: "error" | "warning" | "info";
    component?: string;
    related?: string;
    count?: number;
    selector: string;
    carbon: string | null;
    message: string;
    rect: { left: number; top: number; width: number; height: number };
    values?: Record<string, unknown>;
  }[];
  auditMs: number;
  loadMs: number;
  error?: string;
};

async function auditPage(
  page: Page,
  url: string,
  script: string,
  variant: Variant,
): Promise<PageResult> {
  const start = performance.now();
  try {
    // Framed pages take a theme from the query, without saving it.
    const query = variant.theme === "white" ? "" : `?theme=${variant.theme}`;
    await page.goto(base + url + query, { waitUntil: "load" });
    await settle(page);
    if (variant.dir === "rtl") {
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      await settle(page);
    }
    const loadMs = Math.round(performance.now() - start);
    await page.addScriptTag({ content: script });
    const result = await page.evaluate(
      (carbon) =>
        (
          window as unknown as {
            __ccsAudit: (options: { carbon: boolean; group: boolean }) => {
              findings: PageResult["findings"];
              ms: number;
            };
          }
        ).__ccsAudit({ carbon, group: true }),
      carbon,
    );
    const findings = result.findings.map((f) => ({
      ...f,
      component: (f.carbon && COMPONENTS.get(f.carbon)) || undefined,
    }));
    return {
      url,
      variant: variant.id,
      findings,
      auditMs: result.ms,
      loadMs,
    };
  } catch (error) {
    return {
      url,
      variant: variant.id,
      findings: [],
      auditMs: 0,
      loadMs: Math.round(performance.now() - start),
      error: String(error).split("\n")[0],
    };
  }
}

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

const all = framedUrls().sort();
const skipped = includeSeeded
  ? []
  : all.filter((url) => SEEDED.some((re) => re.test(url)));
const urls = all.filter(
  (url) => !skipped.includes(url) && (!filter || url.includes(filter)),
);

let preview: ChildProcess | undefined;
if (!base) [base, preview] = await startPreview();
const script = await bundleAudit();
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
        results.push(await auditPage(page, url, script, variant));
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

const BASELINE = join(ROOT, `scripts/audit-docs.baseline${suffix}.json`);
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
