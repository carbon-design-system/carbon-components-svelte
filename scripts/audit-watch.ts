/**
 * Audits a few docs examples or e2e fixtures, then audits them again on
 * every save and prints only what changed: findings that appeared or went
 * away, and the token values of `--inspect` elements that moved. For
 * designing a component with the checks running beside the editor.
 *
 *   bun run audit:watch --filter Tile [--source docs|fixtures] [--carbon]
 *     [--inspect ".bx--tile"] [--width 320,1056] [--dir ltr,rtl]
 *     [--theme white,g100] [--json]
 *
 * It starts the Vite dev server for the source, so edits to `src/` and the
 * examples reach the page without a build. A `css/` change runs
 * `bun run build:css` first. `--json` prints one JSON line per run, for an
 * agent to read.
 */
import { spawnSync } from "node:child_process";
import { watch } from "node:fs";
import { join, relative } from "node:path";
import { chromium, type Page } from "@playwright/test";
import {
  auditPage,
  bundleDevtools,
  componentsByBlock,
  type Finding,
  type PageResult,
  pageUrls,
  ROOT,
  SEEDED,
  startServer,
  type Variant,
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

const filter = arg("filter");
const source = arg("source", "docs") === "fixtures" ? "fixtures" : "docs";
const carbon = arg("carbon") === "true";
const inspect = arg("inspect");
const json = arg("json") === "true";
const variants = variantsOf(
  list("width", "1056"),
  list("dir", "ltr"),
  list("theme", "white"),
);

// More pages make each run slower than an edit is worth waiting for.
const MAX_PAGES = 12;

const urls = pageUrls(source).filter(
  (url) => filter && url.includes(filter) && !SEEDED.some((re) => re.test(url)),
);
if (!filter || urls.length === 0) {
  console.error(
    "Pass --filter with part of a page name, such as --filter Tile.",
  );
  process.exit(1);
}
if (urls.length * variants.length > MAX_PAGES) {
  console.error(
    `--filter ${filter} matches ${urls.length} pages in ${variants.length} variant(s); narrow it to ${MAX_PAGES} or fewer:\n  ${urls.join("\n  ")}`,
  );
  process.exit(1);
}

const [base, server] = await startServer(source, { dev: true, port: 4180 });
const components = componentsByBlock();
const browser = await chromium.launch();
const targets: { url: string; variant: Variant; page: Page }[] = (
  await Promise.all(
    variants.map(async (variant) => {
      const context = await browser.newContext({
        viewport: { width: variant.width, height: 800 },
      });
      return Promise.all(
        urls.map(async (url) => ({
          url,
          variant,
          page: await context.newPage(),
        })),
      );
    }),
  )
).flat();

const shown = (f: Finding) => f.severity !== "info";
const keyOf = (f: Finding) => `${f.check}|${f.selector}|${f.message}`;
const label = (t: { url: string; variant: Variant }) =>
  variants.length > 1 ? `${t.url} (${t.variant.id})` : t.url;

/** Leaf values of a JSON value by path, to diff two `inspect` results. */
function leaves(value: unknown, path = "", out = new Map<string, string>()) {
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      leaves(child, path ? `${path}.${key}` : key, out);
    }
  } else {
    out.set(path, JSON.stringify(value));
  }
  return out;
}

let previous = new Map<string, PageResult>();
let first = true;

async function run(changed: string[]) {
  const started = performance.now();
  const script = await bundleDevtools();
  const results = await Promise.all(
    targets.map((t) =>
      auditPage(t.page, {
        base,
        url: t.url,
        script,
        variant: t.variant,
        source,
        carbon,
        components,
        inspect,
        reload: !first,
      }),
    ),
  );
  const ms = Math.round(performance.now() - started);
  const report = targets.map((t, i) => {
    const result = results[i];
    const before = previous.get(label(t));
    // The first run lists errors and warnings. Later runs list every
    // finding that appeared or went away, `info` too: an off-scale value a
    // change just added to a Carbon component is `info`, and it is news.
    const now = result.findings.filter(shown);
    const was = new Set((before?.findings ?? []).map(keyOf));
    const is = new Set(result.findings.map(keyOf));
    const changes: string[] = [];
    if (before?.inspected && result.inspected) {
      result.inspected.forEach((item, index) => {
        const old = leaves(before.inspected?.[index]);
        for (const [path, value] of leaves(item)) {
          if (old.get(path) !== value) {
            changes.push(
              `[${index}] ${path}: ${old.get(path) ?? "–"} → ${value}`,
            );
          }
        }
      });
    }
    return {
      page: label(t),
      error: result.error,
      added: first ? now : result.findings.filter((f) => !was.has(keyOf(f))),
      fixed: [...was].filter((key) => !is.has(key)),
      total: now.length,
      info: result.findings.length - now.length,
      inspected: first ? result.inspected : undefined,
      inspectChanges: changes,
    };
  });
  previous = new Map(targets.map((t, i) => [label(t), results[i]]));

  if (json) {
    console.log(JSON.stringify({ ms, changed, pages: report }));
  } else {
    const time = new Date().toLocaleTimeString();
    console.log(
      `\n${time} ${first ? "Audited" : `Audited after ${changed.join(", ")} changed;`} ${targets.length} page(s) in ${ms}ms`,
    );
    for (const r of report) {
      if (r.error) {
        console.log(`  ${r.page}: ${r.error}`);
        continue;
      }
      const quiet =
        !r.added.length && !r.fixed.length && !r.inspectChanges.length;
      if (quiet && !first) continue;
      console.log(
        `  ${r.page}: ${r.total} finding(s)${r.info ? `, ${r.info} info` : ""}`,
      );
      for (const f of r.added) {
        console.log(
          `    + ${f.severity} ${f.check} · ${f.message} · ${f.selector}`,
        );
      }
      for (const key of r.fixed) {
        console.log(`    - fixed ${key.split("|").reverse().join(" · ")}`);
      }
      for (const line of r.inspectChanges) console.log(`    ~ ${line}`);
      for (const item of r.inspected ?? []) {
        console.log(`    inspect ${JSON.stringify(item)}`);
      }
    }
  }
  first = false;
}

await run([]);

let pending = new Set<string>();
let timer: ReturnType<typeof setTimeout> | undefined;
let running = Promise.resolve();
const WATCHED = [
  "src",
  "css",
  source === "docs" ? "docs/src/pages/framed" : "e2e/fixtures",
];

for (const dir of WATCHED) {
  watch(join(ROOT, dir), { recursive: true }, (_event, file) => {
    // Skip built CSS (a `css/` change rebuilds it) and editors' temp files.
    const name = file?.split("/").pop() ?? "";
    if (!file || file.endsWith(".css") || name.startsWith(".")) return;
    pending.add(relative(ROOT, join(ROOT, dir, file)));
    clearTimeout(timer);
    timer = setTimeout(() => {
      const changed = [...pending];
      pending = new Set();
      running = running.then(async () => {
        if (changed.some((file) => file.endsWith(".scss"))) {
          spawnSync("bun", ["run", "build:css"], {
            cwd: ROOT,
            stdio: "ignore",
          });
        }
        await run(changed);
      });
    }, 250);
  });
}

if (!json) console.log(`\nWatching ${WATCHED.join(", ")}. Ctrl+C to stop.`);
// Close the browser and the dev server on Ctrl+C and on a plain kill, or
// both keep running.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    server.kill();
    await browser.close();
    process.exit(0);
  });
}
