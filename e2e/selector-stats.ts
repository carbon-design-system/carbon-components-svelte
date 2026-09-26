/**
 * CDP harness for CSS selector matching cost during a full-document recalc.
 *
 * Clones a fixture's rendered markup to scale, then repeatedly changes an
 * inherited custom property on `<html>` that no rule reads. Every element
 * inherits it, so Blink re-resolves style (selector matching included) for
 * the whole document, while computed values stay put and no transitions
 * start. `--trigger theme` toggles `theme="white"` / `"g100"` instead: the
 * real theme-switch cost, but color transitions on every element add work
 * that has nothing to do with selectors.
 *
 * Two passes per scenario:
 *
 * 1. Traced: each toggle is recorded with the category behind DevTools'
 *    "Enable CSS selector stats" (`disabled-by-default-blink.debug`). Chromium
 *    emits `SelectorStats` trace events whose
 *    `args.selector_stats.selector_timings[]` hold per-selector
 *    `"elapsed (us)"`, `match_attempts`, `match_count`, `fast_reject_count`,
 *    `selector` and `style_sheet_id` (checked against Playwright's bundled
 *    Chromium 153). Blink times every match attempt, so the clock read adds
 *    a fixed cost per attempt: `elapsed` overweights selectors that are
 *    attempted often but rejected cheaply, and tracing inflates recalc ~10x.
 *    Use these numbers to rank, not to size a saving.
 * 2. Untraced: `Performance.getMetrics()` `RecalcStyleDuration` per toggle
 *    with the library sheet swapped for variants that delete selector
 *    families (see `runScenario`). Variants are interleaved per run and
 *    diffed against the same run's baseline. Only selectors that matched
 *    nothing are deleted, so the paired diff is pure matching cost: the most
 *    a rewrite of them to class tails could save.
 *
 * Reports the top selectors by median elapsed time, overall and restricted
 * to selectors whose rightmost compound has no id / class / attribute (i.e.
 * a type or `*` tail, bucketed by tag or universal, so tested against every
 * matching element in the page).
 *
 * Usage:
 *   BUILD_CSS_MINIFY=1 bun scripts/build-css
 *   bun e2e/selector-stats.ts <scenario|all> [--runs 15] [--recalc-runs 40]
 *     [--inner 5] [--top 25] [--scale N] [--trigger var|theme] [--json out.json]
 *     [--url <base>]
 *
 * `--runs` is the traced sample count, `--recalc-runs` the untraced one;
 * each untraced sample is the min of `--inner` back-to-back toggles.
 */
import { writeFile } from "node:fs/promises";
import { type Browser, type CDPSession, chromium, type Page } from "playwright";
import { fixtures, startServer } from "./cascade-snapshot";

const PORT = 4177;
const [scenarioKey, ...rest] = process.argv.slice(2);
const opt = (name: string): string | undefined => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
const RUNS = Number(opt("runs") ?? 15);
const RECALC_RUNS = Number(opt("recalc-runs") ?? 40);
const INNER = Number(opt("inner") ?? 5);
const TOP = Number(opt("top") ?? 25);
const SCALE = opt("scale");
const JSON_OUT = opt("json");
const URL = opt("url");
const TRIGGER = opt("trigger") ?? "var";

const TRACE_CATEGORIES = [
  "disabled-by-default-blink.debug",
  "devtools.timeline",
];

interface Scenario {
  fixture: string;
  /** Copies of the fixture's `#app` content in the page, original included. */
  scale: number;
}

const scenarios: Record<string, Scenario> = {
  // Plain, sortable, expandable, batch and radio tables with header icons.
  "data-table": { fixture: "data-table", scale: 12 },
  // 50 rows, each with an OverflowMenu icon button.
  "data-table-overflow": { fixture: "data-table-overflow-menu", scale: 10 },
  "tree-view": { fixture: "tree-view-virtualize", scale: 40 },
  // Links with trailing icons (`.bx--link__icon svg`, `path`).
  "link-icons": { fixture: "link", scale: 200 },
  // Buttons with `.bx--btn__icon` (`.bx--btn__icon path:not(...)`).
  "button-icons": { fixture: "menu-button", scale: 300 },
};

interface Timing {
  elapsed: number;
  attempts: number;
  matches: number;
  fastRejects: number;
}

interface TraceEvent {
  name: string;
  ph: string;
  dur?: number;
  args?: {
    elementCount?: number;
    selector_stats?: {
      selector_timings?: Array<{
        "elapsed (us)": number;
        match_attempts: number;
        match_count: number;
        fast_reject_count: number;
        selector: string;
        style_sheet_id: string;
      }>;
    };
  };
}

interface SelectorRow extends Timing {
  selector: string;
  sheet: string;
  share: number;
  typeTail: boolean;
}

interface Report {
  scenario: string;
  fixture: string;
  scale: number;
  elements: number;
  recalc: Array<{
    variant: string;
    removedSelectors: number;
    ms: Stats;
    /** Paired difference from baseline in the same run. */
    diffMs: Stats;
  }>;
  traced: {
    runs: number;
    updateLayoutTreeMs: Stats;
    elementCount: Stats;
    selectorTotalMs: Stats;
    attempts: Stats;
    typeTailShare: Stats;
    universalShare: Stats;
    typeTailAttemptShare: Stats;
    floorNsPerAttempt: number;
  };
  top: SelectorRow[];
  topTypeTail: SelectorRow[];
}

interface Stats {
  median: number;
  iqr: number;
  min: number;
  max: number;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function iqr(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.floor(p * (s.length - 1))];
  return q(0.75) - q(0.25);
}

function stats(xs: number[]): Stats {
  return {
    median: median(xs),
    iqr: iqr(xs),
    min: Math.min(...xs),
    max: Math.max(...xs),
  };
}

const COMBINATOR = /[\s>+~]/;
/** Id, class or attribute: what Blink buckets a rule by before its tag. */
const BUCKETABLE = /[.#[]/;
const TYPE_SELECTOR = /^[a-z]/i;

/**
 * Rightmost compound of a complex selector, with functional pseudo-class
 * arguments removed: `.a > b:not(.c):hover` -> `b:not:hover`.
 */
function rightmostCompound(selector: string): string {
  return splitRightmost(selector).compound;
}

/** True when the selector has more than one compound (`.a svg`, not `svg`). */
function hasCombinator(selector: string): boolean {
  return splitRightmost(selector).start > 0;
}

function splitRightmost(selector: string): {
  start: number;
  compound: string;
} {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (depth === 0 && COMBINATOR.test(ch)) start = i + 1;
  }
  let compound = selector.slice(start);
  // Drop `(...)` groups, innermost first.
  let prev: string;
  do {
    prev = compound;
    compound = compound.replace(/\([^()]*\)/g, "");
  } while (compound !== prev);
  return { start, compound };
}

/**
 * True when Blink can only bucket the rule by tag or universal: no id,
 * class or attribute in the rightmost compound.
 */
export function isTypeTail(selector: string): boolean {
  return !BUCKETABLE.test(rightmostCompound(selector));
}

function isUniversalTail(selector: string): boolean {
  const c = rightmostCompound(selector);
  return isTypeTail(selector) && !TYPE_SELECTOR.test(c);
}

function sheetLabel(id: string, libSheets: Set<string>): string {
  if (id === "ua-style-sheet") return "ua";
  return libSheets.has(id) ? "lib" : "other";
}

/** Flips the trigger on (`true`) or off and forces the recalc. */
async function toggle(page: Page, on: boolean): Promise<void> {
  await page.evaluate(
    ({ on, trigger }) => {
      const root = document.documentElement;
      if (trigger === "theme")
        root.setAttribute("theme", on ? "g100" : "white");
      else root.style.setProperty("--ccs-selector-stats", on ? "1" : "0");
      void document.body.offsetHeight;
    },
    { on, trigger: TRIGGER },
  );
}

async function trace(cdp: CDPSession, fn: () => Promise<void>) {
  const events: TraceEvent[] = [];
  const onData = (e: { value: object[] }) => {
    events.push(...(e.value as TraceEvent[]));
  };
  cdp.on("Tracing.dataCollected", onData);
  const complete = new Promise<void>((r) =>
    cdp.once("Tracing.tracingComplete", () => r()),
  );
  await cdp.send("Tracing.start", {
    traceConfig: { includedCategories: TRACE_CATEGORIES },
    transferMode: "ReportEvents",
  });
  await fn();
  await cdp.send("Tracing.end");
  await complete;
  cdp.off("Tracing.dataCollected", onData);
  return events;
}

async function loadScenario(
  page: Page,
  base: string,
  fixture: string,
  scale: number,
): Promise<number> {
  await page.goto(`${base}/${fixture}.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  return page.evaluate((n) => {
    const app = document.getElementById("app");
    if (!app) throw new Error("#app not found");
    // Each copy gets its own wrapper: appending all copies as siblings
    // would give `~` / `+` selectors thousands of siblings to walk, which
    // no real page has.
    const originals = Array.from(app.children);
    for (let i = 0; i < n - 1; i++) {
      const copy = document.createElement("div");
      for (const el of originals) copy.appendChild(el.cloneNode(true));
      app.appendChild(copy);
    }
    document.documentElement.setAttribute("theme", "white");
    void document.body.offsetHeight;
    return document.getElementsByTagName("*").length;
  }, scale);
}

/**
 * Serialises a copy of the library stylesheet with `drop`ped selectors
 * removed (a rule whose whole selector list goes is deleted) and stores it
 * as `window.__ccsVariants[name]`. Baseline runs through the same CSSOM
 * round-trip with nothing dropped, so every variant is parsed the same way.
 * Returns the number of selectors removed.
 */
async function buildVariant(
  page: Page,
  name: string,
  drop: (selector: string) => boolean,
): Promise<number> {
  const rules = await page.evaluate(() => {
    const w = window as unknown as { __ccsSource: string };
    if (!w.__ccsSource) {
      const style = Array.from(document.querySelectorAll("style")).sort(
        (a, b) => b.textContent.length - a.textContent.length,
      )[0];
      style.setAttribute("data-ccs-lib", "");
      w.__ccsSource = style.textContent;
    }
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(w.__ccsSource);
    const out: Array<{ path: number[]; selectorText: string }> = [];
    const visit = (list: CSSRuleList, path: number[]) => {
      Array.from(list).forEach((rule, i) => {
        if (rule instanceof CSSStyleRule) {
          out.push({ path: [...path, i], selectorText: rule.selectorText });
        } else if ("cssRules" in rule) {
          visit((rule as CSSGroupingRule).cssRules, [...path, i]);
        }
      });
    };
    visit(sheet.cssRules, []);
    return out;
  });

  let removed = 0;
  const edits: Array<{ path: number[]; selectorText: string | null }> = [];
  for (const { path, selectorText } of rules) {
    const parts = splitSelectorList(selectorText);
    const keep = parts.filter((p) => !drop(p));
    if (keep.length === parts.length) continue;
    removed += parts.length - keep.length;
    edits.push({ path, selectorText: keep.length ? keep.join(", ") : null });
  }

  await page.evaluate(
    ({ name, edits }) => {
      const w = window as unknown as {
        __ccsSource: string;
        __ccsVariants?: Record<string, string>;
      };
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(w.__ccsSource);
      // Last rule first, so deletions don't shift indices still pending.
      for (const { path, selectorText } of edits.reverse()) {
        let parent: CSSStyleSheet | CSSGroupingRule = sheet;
        for (const i of path.slice(0, -1)) {
          parent = parent.cssRules[i] as CSSGroupingRule;
        }
        const index = path[path.length - 1];
        if (selectorText === null) parent.deleteRule(index);
        else {
          (parent.cssRules[index] as CSSStyleRule).selectorText = selectorText;
        }
      }
      w.__ccsVariants ??= {};
      w.__ccsVariants[name] = Array.from(sheet.cssRules)
        .map((r) => r.cssText)
        .join("\n");
    },
    { name, edits },
  );
  return removed;
}

async function useVariant(page: Page, name: string): Promise<void> {
  await page.evaluate((n) => {
    const w = window as unknown as { __ccsVariants: Record<string, string> };
    const style = document.querySelector("style[data-ccs-lib]");
    if (!style) throw new Error("library <style> not found");
    style.textContent = w.__ccsVariants[n];
    void document.body.offsetHeight;
  }, name);
}

/** Splits a selector list at top-level commas. */
function splitSelectorList(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const ch = list[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      out.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(list.slice(start).trim());
  return out;
}

/**
 * Untraced `RecalcStyleDuration` per variant. Variants are interleaved
 * within each run (rotating the order), so machine load drifting over the
 * measurement hits all of them alike; each sample is also paired with the
 * baseline sample from the same run.
 */
async function measureRecalc(
  page: Page,
  cdp: CDPSession,
  names: string[],
): Promise<Record<string, { ms: number[]; diff: number[] }>> {
  const read = async () => {
    const { metrics } = await cdp.send("Performance.getMetrics");
    return metrics.find((m) => m.name === "RecalcStyleDuration")?.value ?? 0;
  };
  // Min of a few back-to-back toggles: other processes can only add time,
  // so the min tracks the uncontended cost far more tightly than one toggle.
  async function recalcMs(): Promise<number> {
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < INNER; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: sequential by design
      const before = await read();
      await toggle(page, true);
      const after = await read();
      await toggle(page, false);
      best = Math.min(best, (after - before) * 1000);
    }
    return best;
  }

  const out: Record<string, { ms: number[]; diff: number[] }> = {};
  for (const n of names) out[n] = { ms: [], diff: [] };

  for (let run = 0; run < RECALC_RUNS; run++) {
    const sample: Record<string, number> = {};
    for (let j = 0; j < names.length; j++) {
      const name = names[(run + j) % names.length];
      // biome-ignore lint/performance/noAwaitInLoops: sequential by design
      await useVariant(page, name);
      // Warmup: let selector/style caches settle on the new sheet.
      for (let i = 0; i < 3; i++) {
        // biome-ignore lint/performance/noAwaitInLoops: sequential by design
        await toggle(page, true);
        await toggle(page, false);
      }
      sample[name] = await recalcMs();
    }
    for (const n of names) {
      out[n].ms.push(sample[n]);
      out[n].diff.push(sample[n] - sample[names[0]]);
    }
  }
  return out;
}

async function runScenario(
  key: string,
  base: string,
  browser: Browser,
): Promise<Report> {
  const scenario = scenarios[key];
  const scale = SCALE ? Number(SCALE) : scenario.scale;

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const elements = await loadScenario(page, base, scenario.fixture, scale);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");

  // Traced selector stats on the page as shipped.

  // The library stylesheet is the one large sheet vite injects for the
  // fixture's `carbon-components-svelte/css/all.css` import; component
  // `<style>` blocks and anything else are labelled "other".
  await cdp.send("DOM.enable");
  const libSheets = new Set<string>();
  cdp.on("CSS.styleSheetAdded", ({ header }) => {
    if (header.length > 100_000) libSheets.add(header.styleSheetId);
  });
  await cdp.send("CSS.enable");
  await toggle(page, true);
  await toggle(page, false);

  const perSelector = new Map<string, Timing[]>();
  const ultMs: number[] = [];
  const ultElements: number[] = [];
  const selectorTotalMs: number[] = [];
  const totalAttempts: number[] = [];
  const typeTailShare: number[] = [];
  const universalShare: number[] = [];
  const typeTailAttemptShare: number[] = [];

  for (let run = 0; run < RUNS; run++) {
    // biome-ignore lint/performance/noAwaitInLoops: sequential by design
    const events = await trace(cdp, () => toggle(page, true));
    await toggle(page, false);

    let ult = 0;
    let ultCount = 0;
    for (const e of events) {
      if (e.name === "UpdateLayoutTree" && e.ph === "X") {
        ult += e.dur ?? 0;
        ultCount += e.args?.elementCount ?? 0;
      }
    }
    ultMs.push(ult / 1000);
    ultElements.push(ultCount);

    const runTimings = new Map<string, Timing>();
    for (const e of events) {
      if (e.name !== "SelectorStats") continue;
      for (const t of e.args?.selector_stats?.selector_timings ?? []) {
        const id = `${sheetLabel(t.style_sheet_id, libSheets)}\u0000${t.selector}`;
        const acc = runTimings.get(id) ?? {
          elapsed: 0,
          attempts: 0,
          matches: 0,
          fastRejects: 0,
        };
        acc.elapsed += t["elapsed (us)"];
        acc.attempts += t.match_attempts;
        acc.matches += t.match_count;
        acc.fastRejects += t.fast_reject_count;
        runTimings.set(id, acc);
      }
    }
    if (runTimings.size === 0) {
      throw new Error(
        "no SelectorStats trace events; this Chromium may not emit them",
      );
    }

    let total = 0;
    let attempts = 0;
    let typeTail = 0;
    let typeTailAttempts = 0;
    let universal = 0;
    for (const [id, t] of runTimings) {
      const selector = id.slice(id.indexOf("\u0000") + 1);
      total += t.elapsed;
      attempts += t.attempts;
      if (isTypeTail(selector)) {
        typeTail += t.elapsed;
        typeTailAttempts += t.attempts;
      }
      if (isUniversalTail(selector)) universal += t.elapsed;
      const list = perSelector.get(id) ?? [];
      list.push(t);
      perSelector.set(id, list);
    }
    selectorTotalMs.push(total / 1000);
    totalAttempts.push(attempts);
    typeTailShare.push(total ? typeTail / total : 0);
    universalShare.push(total ? universal / total : 0);
    typeTailAttemptShare.push(attempts ? typeTailAttempts / attempts : 0);
  }

  const totalMedianUs = median(selectorTotalMs) * 1000;
  const rows: SelectorRow[] = [];
  for (const [id, list] of perSelector) {
    const [sheet, selector] = id.split("\u0000");
    // Selectors absent from a run contributed 0 to it.
    const pad = (xs: number[]) => [...xs, ...Array(RUNS - xs.length).fill(0)];
    const elapsed = median(pad(list.map((t) => t.elapsed)));
    rows.push({
      selector,
      sheet,
      elapsed,
      attempts: median(pad(list.map((t) => t.attempts))),
      matches: median(pad(list.map((t) => t.matches))),
      fastRejects: median(pad(list.map((t) => t.fastRejects))),
      share: totalMedianUs ? elapsed / totalMedianUs : 0,
      typeTail: isTypeTail(selector),
    });
  }
  rows.sort((a, b) => b.elapsed - a.elapsed || b.attempts - a.attempts);
  // Cheapest per-attempt cost among frequently attempted selectors: roughly
  // the tracing clock overhead, since a bloom-filter reject is a few ns.
  const floorNs = Math.min(
    ...rows
      .filter((r) => r.attempts >= 1000)
      .map((r) => (r.elapsed * 1000) / r.attempts),
  );

  // Untraced recalc with selector families deleted. Variants delete only
  // selectors that matched nothing in any traced run, so computed style is
  // unchanged and any delta is matching cost alone:
  // - combinator-qualified type/`*` tails (`.a svg`, `.a > *`), the rewrite
  //   candidates;
  // - control: as many qualified class-tail selectors whose rightmost
  //   classes are absent from the page (never attempted; expect ~0).
  // Deleting matched rules too would also skip their declarations, which
  // is not a saving a selector rewrite can deliver.
  const unmatched = new Set(
    [...perSelector]
      .filter(
        ([id, list]) =>
          id.startsWith("lib\u0000") && list.every((t) => t.matches === 0),
      )
      .map(([id]) => id.slice(id.indexOf("\u0000") + 1)),
  );
  const isQualifiedTypeTail = (sel: string) =>
    isTypeTail(sel) && hasCombinator(sel);
  const pageClasses = new Set(
    await page.evaluate(() =>
      Array.from(document.querySelectorAll("[class]")).flatMap((el) =>
        Array.from(el.classList),
      ),
    ),
  );
  const unmatchedTypeTails = [...unmatched].filter(isQualifiedTypeTail);
  let controlLeft = unmatchedTypeTails.length;
  const isAbsentClassTail = (sel: string) => {
    if (controlLeft <= 0 || !hasCombinator(sel)) return false;
    const classes = [...rightmostCompound(sel).matchAll(/\.([\w-]+)/g)];
    if (!classes.length || classes.some(([, c]) => pageClasses.has(c))) {
      return false;
    }
    controlLeft--;
    return true;
  };

  const variants = [
    { name: "baseline", drop: () => false },
    {
      name: "-unmatched type/* tails",
      drop: (sel: string) => unmatched.has(sel) && isQualifiedTypeTail(sel),
    },
    { name: "-control class tails", drop: isAbsentClassTail },
  ];
  const removed: Record<string, number> = {};
  for (const v of variants) {
    // biome-ignore lint/performance/noAwaitInLoops: sequential by design
    removed[v.name] = await buildVariant(page, v.name, v.drop);
  }
  const samples = await measureRecalc(
    page,
    cdp,
    variants.map((v) => v.name),
  );
  await context.close();

  const recalc: Report["recalc"] = variants.map((v) => ({
    variant: v.name,
    removedSelectors: removed[v.name],
    ms: stats(samples[v.name].ms),
    diffMs: stats(samples[v.name].diff),
  }));

  return {
    scenario: key,
    fixture: scenario.fixture,
    scale,
    elements,
    recalc,
    traced: {
      runs: RUNS,
      updateLayoutTreeMs: stats(ultMs),
      elementCount: stats(ultElements),
      selectorTotalMs: stats(selectorTotalMs),
      attempts: stats(totalAttempts),
      typeTailShare: stats(typeTailShare),
      universalShare: stats(universalShare),
      typeTailAttemptShare: stats(typeTailAttemptShare),
      floorNsPerAttempt: floorNs,
    },
    top: rows.slice(0, TOP),
    topTypeTail: rows.filter((r) => r.typeTail).slice(0, TOP),
  };
}

const fmt = (s: Stats, digits = 3) =>
  `median=${s.median.toFixed(digits)}  iqr=${s.iqr.toFixed(digits)}  min=${s.min.toFixed(digits)}  max=${s.max.toFixed(digits)}`;

function printTable(title: string, rows: SelectorRow[]): void {
  console.log(`\n  ${title}`);
  console.log(
    "    elapsed(us)  share   attempts  matches  fastrej  sheet  selector",
  );
  for (const r of rows) {
    console.log(
      `    ${String(r.elapsed).padStart(11)}  ${(r.share * 100).toFixed(1).padStart(5)}%  ${String(r.attempts).padStart(8)}  ${String(r.matches).padStart(7)}  ${String(r.fastRejects).padStart(7)}  ${r.sheet.padEnd(5)}  ${r.selector}`,
    );
  }
}

function print(r: Report): void {
  console.log(
    `\nscenario=${r.scenario} fixture=${r.fixture} scale=${r.scale} elements=${r.elements} trigger=${TRIGGER}`,
  );
  const base = r.recalc[0].ms.median;
  console.log(
    `  untraced RecalcStyleDuration ms (${RECALC_RUNS} runs, min of ${INNER}):`,
  );
  for (const v of r.recalc) {
    const delta = (v.diffMs.median / base) * 100;
    console.log(
      `    ${v.variant.padEnd(24)} removed=${String(v.removedSelectors).padStart(4)}  ${fmt(v.ms)}`,
    );
    if (v !== r.recalc[0]) {
      console.log(
        `    ${"".padEnd(24)} paired diff: ${fmt(v.diffMs)}  (${delta.toFixed(1)}% of baseline)`,
      );
    }
  }
  const t = r.traced;
  console.log(`  traced (${t.runs} runs):`);
  console.log(`    UpdateLayoutTree ms:       ${fmt(t.updateLayoutTreeMs)}`);
  console.log(`    elements recalculated:     ${fmt(t.elementCount, 0)}`);
  console.log(`    sum of selector ms:        ${fmt(t.selectorTotalMs)}`);
  console.log(`    match attempts:            ${fmt(t.attempts, 0)}`);
  console.log(`    type/* tail share of ms:   ${fmt(t.typeTailShare)}`);
  console.log(`    * tail share of ms:        ${fmt(t.universalShare)}`);
  console.log(`    type/* tail attempt share: ${fmt(t.typeTailAttemptShare)}`);
  console.log(
    `    floor ns/attempt:          ${t.floorNsPerAttempt.toFixed(1)} (tracing overhead; elapsed below includes it per attempt)`,
  );
  printTable(`top ${TOP} selectors by median elapsed`, r.top);
  printTable(`top ${TOP} type/* tail selectors`, r.topTypeTail);
}

async function main(): Promise<void> {
  const keys = scenarioKey === "all" ? Object.keys(scenarios) : [scenarioKey];
  if (!keys.every((k) => k in scenarios)) {
    console.error(
      `usage: selector-stats.ts <${Object.keys(scenarios).join("|")}|all> [--runs N] [--recalc-runs N] [--inner N] [--top N] [--scale N] [--trigger var|theme] [--json out.json]`,
    );
    process.exit(2);
  }

  const names = await fixtures("");
  for (const k of keys) {
    if (!names.includes(scenarios[k].fixture)) {
      throw new Error(`fixture not found: ${scenarios[k].fixture}`);
    }
  }

  const { base, server } = await startServer(PORT, URL);
  const browser = await chromium.launch();
  const reports: Report[] = [];

  try {
    console.log(`chromium ${browser.version()}`);
    for (const key of keys) {
      // biome-ignore lint/performance/noAwaitInLoops: sequential by design
      const report = await runScenario(key, base, browser);
      print(report);
      reports.push(report);
    }
    if (JSON_OUT) {
      await writeFile(JSON_OUT, JSON.stringify(reports, null, 2));
      console.log(`\nwrote ${JSON_OUT}`);
    }
  } finally {
    await browser.close();
    server?.kill();
  }
}

if (import.meta.main) {
  await main();
}
