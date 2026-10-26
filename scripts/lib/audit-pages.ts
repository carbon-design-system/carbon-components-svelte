/**
 * Shared by scripts/audit-docs.ts and scripts/audit-watch.ts: which pages
 * to audit, how to serve and settle them, and the dev tools bundle each
 * page gets.
 */
import { type ChildProcess, spawn } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import type { Page } from "@playwright/test";

export const ROOT = resolve(import.meta.dir, "../..");
const FRAMED = join(ROOT, "docs/src/pages/framed");
const FIXTURES = join(ROOT, "e2e/fixtures");
const SVELTE_FILE = /\.svelte$/;
const FIRST_BLOCK = /\bbx--([a-z0-9-]+)/;
const BEM_SEPARATOR = /__|--/;
const CAPITAL = /[A-Z]/g;

/** `docs`: the framed docs examples. `fixtures`: the e2e fixtures. */
export type Source = "docs" | "fixtures";

export type Variant = {
  width: number;
  dir: "ltr" | "rtl";
  theme: string;
  id: string;
};

export type Finding = {
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
};

export type PageResult = {
  url: string;
  variant: string;
  findings: Finding[];
  /** `inspect(selector)` for each element `--inspect` matched. */
  inspected?: unknown[];
  /**
   * With `rhythm`: for each type style, how many lines sit at each offset
   * from the nearest 8px baseline row.
   */
  rhythm?: Record<string, Record<string, number>>;
  auditMs: number;
  loadMs: number;
  error?: string;
};

// Dev tools demos seed layout bugs on purpose, and draw over the page.
export const SEEDED = [
  /^\/framed\/LayoutInspector\//,
  /^\/framed\/DevToolbar\//,
  /^\/framed\/Grid\/GridOverlay/,
  /^\/dev-aids\.html$/,
];

/** Every combination of the widths, directions, and themes given. */
export function variantsOf(
  widths: string[],
  dirs: string[],
  themes: string[],
): Variant[] {
  return widths.flatMap((width) =>
    dirs.flatMap((dir) =>
      themes.map((theme) => ({
        width: Number(width),
        dir: dir === "rtl" ? ("rtl" as const) : ("ltr" as const),
        theme,
        id: `${width}${dir === "rtl" ? "-rtl" : ""}${theme === "white" ? "" : `-${theme}`}`,
      })),
    ),
  );
}

function framedUrls(dir = FRAMED): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return framedUrls(path);
    if (!name.endsWith(".svelte") || name.startsWith("_")) return [];
    return [`/framed/${relative(FRAMED, path).replace(SVELTE_FILE, "")}`];
  });
}

function fixtureUrls(): string[] {
  return readdirSync(FIXTURES)
    .filter(
      (name) =>
        name.endsWith(".html") && name !== "index.html" && name !== "host.html",
    )
    .map((name) => `/${name}`);
}

/** Page URLs for a source, sorted. */
export function pageUrls(source: Source) {
  return (source === "docs" ? framedUrls() : fixtureUrls()).sort();
}

/**
 * Likely component for each Carbon block, such as `bx--btn` for Button.
 * A component named after the block wins (`bx--data-table` is DataTable,
 * though Table's markup starts with it too); otherwise, the first
 * component whose markup starts with the block.
 */
export function componentsByBlock() {
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

/**
 * The dev tools' data functions, bundled from source as one script that
 * sets `window.__ccsDevtools = { audit, inspect, baselines }`.
 */
export async function bundleDevtools() {
  const entry = join(tmpdir(), "ccs-devtools-entry.js");
  const from = (file: string) => JSON.stringify(join(ROOT, file));
  writeFileSync(
    entry,
    [
      `import { audit } from ${from("src/devtools/audit.js")};`,
      `import { inspect } from ${from("src/devtools/inspect.js")};`,
      `import { baselines } from ${from("src/devtools/baselines.js")};`,
      "window.__ccsDevtools = { audit, inspect, baselines };",
    ].join("\n"),
  );
  const result = await Bun.build({
    entrypoints: [entry],
    format: "iife",
    minify: true,
  });
  if (!result.success) throw new Error(result.logs.join("\n"));
  return result.outputs[0].text();
}

/**
 * Serves a source. The docs come from `docs/dist` with `vite preview`, or
 * from the Vite dev server with `dev` (for watching); the e2e fixtures
 * always come from the dev server.
 */
export async function startServer(
  source: Source,
  { dev = false, port = source === "docs" ? 4175 : 4176 } = {},
): Promise<[string, ChildProcess]> {
  const args =
    source === "fixtures"
      ? ["vite", "--config", "e2e/vite.config.ts"]
      : dev
        ? ["vite"]
        : ["vite", "preview"];
  const child = spawn(
    "bunx",
    [...args, "--port", String(port), "--strictPort"],
    { cwd: source === "docs" ? join(ROOT, "docs") : ROOT, stdio: "ignore" },
  );
  const url = `http://localhost:${port}`;
  for (let i = 0; i < 300; i++) {
    try {
      // biome-ignore lint/performance/noAwaitInLoops: polls until the server answers
      if ((await fetch(url)).ok) return [url, child];
    } catch {}
    await Bun.sleep(100);
  }
  child.kill();
  throw new Error(
    source === "docs" && !dev
      ? "vite preview did not start; is docs/dist built?"
      : "the Vite dev server did not start",
  );
}

/**
 * Waits for the page to render, the DOM to go quiet, fonts to load, and
 * transitions to end.
 */
export async function settle(page: Page, source: Source) {
  if (source === "docs") {
    await page.waitForFunction(() =>
      document.body.classList.contains("framed"),
    );
  } else {
    await page.waitForFunction(
      () =>
        document.readyState === "complete" &&
        document.body.childElementCount > 0,
    );
  }
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

type Devtools = {
  audit: (options: { carbon: boolean; group: boolean }) => {
    findings: Finding[];
    ms: number;
  };
  inspect: (target: Element) => unknown;
  baselines: (options: { step: number }) => {
    lines: { type: string | null; delta: number | null }[];
  };
};

/**
 * Loads one page in one variant and audits it. With `inspect`, it also
 * returns `inspect()` for each element that matches the selector.
 */
export async function auditPage(
  page: Page,
  options: {
    base: string;
    url: string;
    script: string;
    variant: Variant;
    source: Source;
    carbon: boolean;
    components: Map<string, string>;
    inspect?: string;
    rhythm?: boolean;
    reload?: boolean;
  },
): Promise<PageResult> {
  const { base, url, script, variant, source, carbon, components } = options;
  const start = performance.now();
  try {
    if (options.reload) {
      await page.reload({ waitUntil: "load" });
    } else {
      // Framed pages take a theme from the query, without saving it.
      const query = variant.theme === "white" ? "" : `?theme=${variant.theme}`;
      await page.goto(base + url + query, { waitUntil: "load" });
    }
    await settle(page, source);
    if (variant.dir === "rtl") {
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      await settle(page, source);
    }
    const loadMs = Math.round(performance.now() - start);
    await page.addScriptTag({ content: script });
    const result = await page.evaluate(
      ([carbon, selector, rhythm]) => {
        const tools = (window as unknown as { __ccsDevtools: Devtools })
          .__ccsDevtools;
        return {
          ...tools.audit({ carbon, group: true }),
          inspected: selector
            ? [...document.querySelectorAll(selector)]
                .filter((el) => !el.closest("[data-ccs-dev-tool]"))
                .slice(0, 5)
                .map((el) => tools.inspect(el))
            : undefined,
          rhythm: rhythm
            ? tools
                .baselines({ step: 8 })
                .lines.reduce<Record<string, Record<string, number>>>(
                  (byType, line) => {
                    const type = line.type ?? "untyped";
                    const delta = String(Math.round((line.delta ?? 0) * 2) / 2);
                    byType[type] ??= {};
                    byType[type][delta] = (byType[type][delta] ?? 0) + 1;
                    return byType;
                  },
                  {},
                )
            : undefined,
        };
      },
      [carbon, options.inspect ?? "", Boolean(options.rhythm)] as const,
    );
    return {
      url,
      variant: variant.id,
      findings: result.findings.map((f) => ({
        ...f,
        component: (f.carbon && components.get(f.carbon)) || undefined,
      })),
      inspected: result.inspected,
      rhythm: result.rhythm,
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
