/**
 * Computed-style snapshot of every e2e fixture, for CSS refactors that change
 * selectors on purpose but must not change what the browser resolves.
 *
 * Capture: loads each `e2e/fixtures/*.html` in Chromium (via the e2e vite
 * config, which aliases `carbon-components-svelte/css` to the local build),
 * per theme, and records `getComputedStyle` for every element and its
 * `::before` / `::after`, keyed by a structural path. Interactive elements
 * are additionally recorded under forced `:hover`, `:focus` / `:focus-visible`
 * and `:active` (CDP `CSS.forcePseudoState`), including their descendants and
 * parent, since state rules usually target a child or sibling.
 *
 * Diff: compares two capture directories element by element and property by
 * property, grouped by (property, before -> after) so a systematic change
 * reads as one line, not hundreds.
 *
 *   bun run build:css
 *   bun e2e/cascade-snapshot.ts capture .context/cascade/base
 *   ...edit css...
 *   bun run build:css
 *   bun e2e/cascade-snapshot.ts capture .context/cascade/head
 *   bun e2e/cascade-snapshot.ts diff .context/cascade/base .context/cascade/head
 *
 * Options: --themes white,g10,g90,g100 (default white,g100)
 *          --only <substring>   capture a subset of fixtures
 *          --no-states          skip forced pseudo states (faster)
 *          --url <base>         use a running server instead of spawning vite
 *          --viewport WxH       default 1280x900; use 320x640 for below-md rules
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

type Styles = Record<string, string>;
type Snapshot = Record<string, Styles>;

const [cmd, ...rest] = process.argv.slice(2);
const opt = (name: string): string | undefined => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
const positional = rest.filter(
  (a, i) => !a.startsWith("--") && !rest[i - 1]?.startsWith("--"),
);

const PORT = 4174;
const THEMES = (opt("themes") ?? "white,g100").split(",");
const ONLY = opt("only");
const STATES = !rest.includes("--no-states");
const URL = opt("url");
const MAX_STATE_ELEMENTS = 80;
const [VIEW_W, VIEW_H] = (opt("viewport") ?? "1280x900")
  .split("x")
  .map((n) => Number(n));

const INTERACTIVE =
  "a, button, input, select, textarea, [tabindex], [role], label, li, tr, td, th, summary";

// ---------------------------------------------------------------------------
// In-page helpers (serialised into the browser)

const PAGE_HELPERS = `
  (() => {
    // Only longhands the loaded stylesheets can set (the browser expands
    // shorthands in CSSStyleDeclaration), so files stay small and diffs stay
    // about the cascade. Custom properties are theme tokens; skip them.
    const declared = new Set();
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      const visit = (list) => {
        for (const rule of list) {
          if (rule.style) for (let i = 0; i < rule.style.length; i++) {
            const name = rule.style[i];
            if (!name.startsWith("--")) declared.add(name);
          }
          if (rule.cssRules) visit(rule.cssRules);
        }
      };
      visit(rules);
    }
    const props = Array.from(declared).sort();
    const pathOf = (el) => {
      const parts = [];
      let node = el;
      while (node && node !== document.documentElement) {
        const sig = node.tagName.toLowerCase() + (node.className && typeof node.className === "string" && node.className.trim() ? "." + node.className.trim().split(/\\s+/).sort().join(".") : "");
        let nth = 0;
        let sib = node.previousElementSibling;
        while (sib) {
          const s = sib.tagName.toLowerCase() + (sib.className && typeof sib.className === "string" && sib.className.trim() ? "." + sib.className.trim().split(/\\s+/).sort().join(".") : "");
          if (s === sig) nth++;
          sib = sib.previousElementSibling;
        }
        parts.unshift(nth ? sig + "[" + nth + "]" : sig);
        node = node.parentElement;
      }
      return parts.join(">");
    };
    const read = (el, pseudo) => {
      const cs = getComputedStyle(el, pseudo || null);
      if (pseudo && (cs.content === "none" || cs.content === "")) return null;
      const out = {};
      for (const p of props) out[p] = cs.getPropertyValue(p);
      return out;
    };
    const record = (el, into, suffix) => {
      const key = pathOf(el) + (suffix || "");
      into[key] = read(el, null);
      const b = read(el, "::before"); if (b) into[key + "::before"] = b;
      const a = read(el, "::after"); if (a) into[key + "::after"] = a;
    };
    window.__ccs = {
      snapshot() {
        const out = {};
        for (const el of document.querySelectorAll("body *")) record(el, out, "");
        return out;
      },
      tagInteractive(selector, max) {
        const els = Array.from(document.querySelectorAll(selector)).slice(0, max);
        els.forEach((el, i) => el.setAttribute("data-ccs-idx", String(i)));
        return els.length;
      },
      snapshotState(idx, state) {
        const el = document.querySelector('[data-ccs-idx="' + idx + '"]');
        const out = {};
        if (!el) return out;
        const suffix = "@" + state;
        if (el.parentElement && el.parentElement !== document.body) record(el.parentElement, out, suffix + "^");
        record(el, out, suffix);
        for (const d of el.querySelectorAll("*")) record(d, out, suffix);
        return out;
      },
    };
  })();
`;

// ---------------------------------------------------------------------------
// Capture

async function fixtures(): Promise<string[]> {
  const dir = path.resolve("e2e/fixtures");
  return (await readdir(dir))
    .filter((f) => f.endsWith(".html"))
    .map((f) => f.slice(0, -".html".length))
    .filter((f) => !ONLY || f.includes(ONLY))
    .sort();
}

async function waitForServer(url: string): Promise<void> {
  for (let i = 0; i < 100; i++) {
    try {
      // biome-ignore lint/performance/noAwaitInLoops: sequential by design
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch {}
    await Bun.sleep(200);
  }
  throw new Error(`server at ${url} did not start`);
}

async function capturePage(
  page: Page,
  url: string,
  theme: string,
): Promise<Snapshot> {
  // The theme attribute must be present before first paint: setting it after
  // load makes every token-driven color transition, and a capture taken
  // mid-transition records intermediate values.
  await page.addInitScript((t) => {
    const apply = () => document.documentElement.setAttribute("theme", t);
    if (document.documentElement) {
      apply();
      return;
    }
    const observer = new MutationObserver(() => {
      if (!document.documentElement) return;
      apply();
      observer.disconnect();
    });
    observer.observe(document, { childList: true });
  }, theme);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(PAGE_HELPERS);
  // Longest Carbon motion token is 400ms; let any load-time transition settle.
  await page.waitForTimeout(500);
  const snap: Snapshot = await page.evaluate("window.__ccs.snapshot()");
  if (!STATES) return snap;

  // Forced states are read immediately, so freeze transitions first or the
  // capture records a color halfway between the two states. The static
  // snapshot above already recorded the real transition declarations.
  await page.addStyleTag({
    content:
      "*, *::before, *::after { transition: none !important; animation: none !important; }",
  });

  const n: number = await page.evaluate(
    ([sel, max]) =>
      (
        window as unknown as {
          __ccs: { tagInteractive: (s: string, m: number) => number };
        }
      ).__ccs.tagInteractive(sel as string, max as number),
    [INTERACTIVE, MAX_STATE_ELEMENTS],
  );
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
  const stateSets: Record<string, string[]> = {
    hover: ["hover"],
    focus: ["focus", "focus-visible"],
    active: ["active"],
  };
  for (let i = 0; i < n; i++) {
    // biome-ignore lint/performance/noAwaitInLoops: sequential by design
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: `[data-ccs-idx="${i}"]`,
    });
    if (!nodeId) continue;
    for (const [state, forced] of Object.entries(stateSets)) {
      // biome-ignore lint/performance/noAwaitInLoops: sequential by design
      await cdp.send("CSS.forcePseudoState", {
        nodeId,
        forcedPseudoClasses: forced,
      });
      const part: Snapshot = await page.evaluate(
        `window.__ccs.snapshotState(${i}, "${state}")`,
      );
      Object.assign(snap, part);
    }
    await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
  }
  await cdp.detach();
  return snap;
}

async function capture(outDir: string): Promise<void> {
  await mkdir(outDir, { recursive: true });
  let server: ReturnType<typeof Bun.spawn> | undefined;
  const base = URL ?? `http://localhost:${PORT}`;
  if (!URL) {
    server = Bun.spawn(
      [
        "bunx",
        "vite",
        "--config",
        "e2e/vite.config.ts",
        "--port",
        String(PORT),
        "--strictPort",
      ],
      { stdout: "ignore", stderr: "inherit" },
    );
    await waitForServer(base);
  }
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: VIEW_W, height: VIEW_H },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const names = await fixtures();
  const started = performance.now();
  try {
    for (const name of names) {
      for (const theme of THEMES) {
        // biome-ignore lint/performance/noAwaitInLoops: sequential by design
        const snap = await capturePage(page, `${base}/${name}.html`, theme);
        await writeFile(
          path.join(outDir, `${name}.${theme}.json`),
          JSON.stringify(snap),
        );
        process.stdout.write(
          `${name} ${theme} ${Object.keys(snap).length} entries\n`,
        );
      }
    }
  } finally {
    await browser.close();
    server?.kill();
  }
  console.log(
    `captured ${names.length} fixtures x ${THEMES.length} themes in ${Math.round((performance.now() - started) / 1000)}s -> ${outDir}`,
  );
}

// ---------------------------------------------------------------------------
// Diff

async function diff(a: string, b: string): Promise<void> {
  const filesA = new Set(await readdir(a));
  const filesB = new Set(await readdir(b));
  const shared = [...filesA]
    .filter((f) => filesB.has(f) && f.endsWith(".json"))
    .sort();
  const onlyA = [...filesA].filter((f) => !filesB.has(f));
  const onlyB = [...filesB].filter((f) => !filesA.has(f));
  if (onlyA.length) console.log(`only in ${a}: ${onlyA.join(", ")}`);
  if (onlyB.length) console.log(`only in ${b}: ${onlyB.join(", ")}`);

  type Group = { count: number; files: Set<string>; examples: string[] };
  const groups = new Map<string, Group>();
  let entriesA = 0;
  let missingKeys = 0;
  let newKeys = 0;

  for (const file of shared) {
    // biome-ignore lint/performance/noAwaitInLoops: sequential by design
    const sa: Snapshot = JSON.parse(await readFile(path.join(a, file), "utf8"));
    const sb: Snapshot = JSON.parse(await readFile(path.join(b, file), "utf8"));
    entriesA += Object.keys(sa).length;
    for (const key of Object.keys(sa)) {
      const va = sa[key];
      const vb = sb[key];
      if (!vb) {
        missingKeys++;
        continue;
      }
      for (const prop of Object.keys(va)) {
        if (va[prop] === vb[prop]) continue;
        const gk = `${prop}: ${va[prop]} -> ${vb[prop]}`;
        let g = groups.get(gk);
        if (!g) {
          g = { count: 0, files: new Set(), examples: [] };
          groups.set(gk, g);
        }
        g.count++;
        g.files.add(file);
        if (g.examples.length < 3) g.examples.push(`${file} ${key}`);
      }
    }
    for (const key of Object.keys(sb)) if (!sa[key]) newKeys++;
  }

  console.log(
    `${shared.length} snapshot files, ${entriesA} entries compared; ` +
      `${missingKeys} entries missing in head, ${newKeys} new in head (DOM/state changes)`,
  );
  if (groups.size === 0) {
    console.log("no computed-style differences");
    return;
  }
  const sorted = [...groups].sort((x, y) => y[1].count - x[1].count);
  console.log(`\n${groups.size} distinct property changes:`);
  for (const [gk, g] of sorted) {
    console.log(`\n${g.count}x  ${gk}`);
    console.log(
      `     fixtures: ${[...g.files].slice(0, 6).join(", ")}${g.files.size > 6 ? ` (+${g.files.size - 6})` : ""}`,
    );
    for (const e of g.examples) console.log(`     e.g. ${e}`);
  }
  process.exit(1);
}

// ---------------------------------------------------------------------------

if (cmd === "capture" && positional[0]) {
  await capture(positional[0]);
} else if (cmd === "diff" && positional[0] && positional[1]) {
  await diff(positional[0], positional[1]);
} else {
  console.error(
    "usage: cascade-snapshot.ts capture <outDir> | diff <dirA> <dirB>",
  );
  process.exit(2);
}
