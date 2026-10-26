/**
 * Runs the dev tools' page checks (`audit` from `carbon-components-svelte/
 * devtools`) on every framed docs example and writes a report.
 *
 *   bun scripts/audit-docs.ts [--carbon] [--width 1056] [--filter Button]
 *     [--concurrency 4] [--base http://localhost:4175] [--out dir]
 *     [--include-seeded]
 *
 * Without `--base`, it serves `docs/dist` with `vite preview`; build it
 * first with `cd docs && bun run build:index-docs && bunx vite build`.
 * The audit is bundled from source and injected into each page, so the
 * docs need no changes.
 */
import { type ChildProcess, spawn } from "node:child_process";
import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { type Browser, chromium, type Page } from "@playwright/test";

const ROOT = resolve(import.meta.dir, "..");
const SVELTE_FILE = /\.svelte$/;
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
const width = Number(arg("width", "1056"));
const concurrency = Number(arg("concurrency", "4"));
const filter = arg("filter");
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
  findings: {
    check: string;
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
): Promise<PageResult> {
  const start = performance.now();
  try {
    await page.goto(base + url, { waitUntil: "load" });
    await settle(page);
    const loadMs = Math.round(performance.now() - start);
    await page.addScriptTag({ content: script });
    const result = await page.evaluate(
      (carbon) =>
        (
          window as unknown as {
            __ccsAudit: (options: { carbon: boolean }) => {
              findings: PageResult["findings"];
              ms: number;
            };
          }
        ).__ccsAudit({ carbon }),
      carbon,
    );
    return { url, findings: result.findings, auditMs: result.ms, loadMs };
  } catch (error) {
    return {
      url,
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
    r.findings.map((f) => ({ ...f, url: r.url })),
  );
  const byCheck = new Map<string, number>();
  for (const f of findings)
    byCheck.set(f.check, (byCheck.get(f.check) ?? 0) + 1);
  const byMessage = new Map<string, { count: number; pages: Set<string> }>();
  for (const f of findings) {
    const key = `${f.check} · ${f.carbon ?? "app"} · ${f.message}`;
    const entry = byMessage.get(key) ?? { count: 0, pages: new Set() };
    entry.count += 1;
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
    `${results.length} pages at ${width}px, ${skipped.length} skipped as seeded demos, ${errors.length} errors. Wall time ${(wallMs / 1000).toFixed(1)}s with ${concurrency} pages at once.`,
    "",
    "| | p50 | p95 | max |",
    "| :--- | ---: | ---: | ---: |",
    `| audit() | ${percentile(audits, 50)}ms | ${percentile(audits, 95)}ms | ${Math.max(0, ...audits)}ms |`,
    `| load + settle | ${percentile(loads, 50)}ms | ${percentile(loads, 95)}ms | ${Math.max(0, ...loads)}ms |`,
    "",
    `## Findings: ${findings.length} on ${pages.length} pages`,
    "",
    ...[...byCheck].map(([check, count]) => `- ${check}: ${count}`),
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
    ...pages.slice(0, 30).map((r) => `- ${r.url}: ${r.findings.length}`),
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
const queue = [...urls];

await Promise.all(
  Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    const context = await browser.newContext({
      viewport: { width, height: 800 },
    });
    const page = await context.newPage();
    for (let url = queue.shift(); url; url = queue.shift()) {
      // biome-ignore lint/performance/noAwaitInLoops: one page at a time per context
      results.push(await auditPage(page, url, script));
    }
    await context.close();
  }),
);

const wallMs = performance.now() - started;
await browser.close();
preview?.kill();

results.sort((a, b) => a.url.localeCompare(b.url));
mkdirSync(out, { recursive: true });
const suffix = carbon ? "-carbon" : "";
writeFileSync(
  join(out, `report${suffix}.json`),
  JSON.stringify({ width, carbon, skipped, results }, null, 2),
);
// Findings only, without timings, to diff two runs.
writeFileSync(
  join(out, `findings${suffix}.json`),
  JSON.stringify(
    results.map((r) => ({ url: r.url, error: r.error, findings: r.findings })),
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
