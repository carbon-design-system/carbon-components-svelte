/**
 * DOM ground-truth "which declarations ever win the cascade" report.
 *
 * Complements two existing tools:
 * - scripts/lib/css-overrides.ts (static: a declaration is provably dead
 *   only when a *later rule with the identical selector* always beats it).
 * - e2e/cascade-snapshot.ts (computed-style diffing, for refactors that
 *   must not change what the browser resolves).
 *
 * This tool finds what static analysis structurally cannot: declarations
 * that lose the cascade to a *different* selector. That can only be
 * answered by asking a real browser which declaration actually applies to
 * a real element, so it loads every `e2e/fixtures/*.html` fixture (like
 * cascade-snapshot.ts, reusing its fixture discovery and server spawning),
 * per theme, and for every element -- plus its `::before`/`::after`, and
 * interactive elements under forced `:hover`/`:focus`/`:active` states --
 * asks CDP `CSS.getMatchedStylesForNode` which author rules from the
 * library stylesheet (`css/all.css`, identified by its text containing
 * `.bx--`; other `regular`-origin stylesheets are Vite/Svelte component
 * styles and are skipped) match, then replays the cascade to see which
 * declaration in each matched rule actually wins. See
 * scripts/lib/css-usage.ts's header for the shorthand-expansion and
 * partial-win approximations used to do that replay.
 *
 * IMPORTANT: "never wins" and "never matched" are evidence bounded by
 * e2e/fixtures/* coverage, not proof of dead CSS. A declaration a fixture
 * never exercises (a theme, a breakpoint, a hover state on an untested
 * element, a consumer override) will show up here even though it wins in
 * the real app. Treat this report as a worklist to spot-check, not a
 * mechanical deletion list. This is also bounded by the emulated browser
 * context: `reducedMotion: "reduce"` (mirroring cascade-snapshot.ts) makes
 * `@media (prefers-reduced-motion: reduce)` permanently active, so a base
 * `transition` declaration it overrides will always show as "lost" here
 * even though it wins for users without that OS preference.
 *
 *   bun run build:css
 *   bun e2e/cascade-usage.ts
 *   bun e2e/cascade-usage.ts --only tooltip --themes white,g100
 *
 * Options: --only <substring>   scope to matching fixtures
 *          --themes white,g10,g90,g100   default white,g100
 *          --no-states           skip forced :hover/:focus/:active (faster)
 *          --url <base>          use a running server instead of spawning vite
 *          --viewport WxH        default 1280x900
 *          --out <dir>           default .context/cascade/usage
 */
import { mkdir, writeFile } from "node:fs/promises";
import { type CDPSession, chromium, type Page } from "playwright";
import type { Protocol } from "playwright-core/types/protocol";
import { parseRules } from "../scripts/lib/css-cascade";
import {
  bytesOf,
  createAggregate,
  type Declaration,
  deadInFixtures,
  foldCandidates,
  type InventoryRule,
  inventoryFromRules,
  type MatchedRule,
  neverMatchedRules,
  normalizeContext,
  normalizeSelector,
  recordObservation,
  type Summary,
  summarize,
  type UsageAggregate,
} from "../scripts/lib/css-usage";
import {
  fixtures,
  INTERACTIVE,
  MAX_STATE_ELEMENTS,
  startServer,
} from "./cascade-snapshot";

const rest = process.argv.slice(2);
const opt = (name: string): string | undefined => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};

const PORT = 4175;
const THEMES = (opt("themes") ?? "white,g100").split(",");
const ONLY = opt("only");
const STATES = !rest.includes("--no-states");
const URL = opt("url");
const OUT = opt("out") ?? ".context/cascade/usage";
const [VIEW_W, VIEW_H] = (opt("viewport") ?? "1280x900")
  .split("x")
  .map((n) => Number(n));
// Per interactive element per forced state, how many descendants (plus the
// element itself and its parent) to re-check: state rules like
// `.foo:hover .bar` usually target close family, but unlike
// cascade-snapshot's batched page.evaluate, every check here is its own CDP
// round trip, so this bounds worst case on large fixtures (DataTable, Tabs).
const MAX_STATE_DESCENDANTS = 30;

const stateSets: Record<string, string[]> = {
  hover: ["hover"],
  focus: ["focus", "focus-visible"],
  active: ["active"],
};

// ---------------------------------------------------------------------------
// CDP -> MatchedRule[]

function toMatchedRule(
  ruleMatch: Protocol.CSS.RuleMatch,
  libSheetIds: Set<string>,
): MatchedRule | undefined {
  const { rule } = ruleMatch;
  if (rule.origin !== "regular") return undefined;
  if (!rule.styleSheetId || !libSheetIds.has(rule.styleSheetId))
    return undefined;
  const declarations: Declaration[] = rule.style.cssProperties
    .filter((p) => !p.disabled && p.parsedOk !== false && p.text)
    .map((p) => ({
      property: p.name,
      value: p.value,
      important: Boolean(p.important),
      longhands:
        p.longhandProperties && p.longhandProperties.length > 0
          ? p.longhandProperties.map((l) => l.name)
          : [p.name],
    }));
  if (declarations.length === 0) return undefined;
  // The first matching selector index is representative; multiple matching
  // selectors on one rule (e.g. `:is(.a, .b)` collapsing) are rare and this
  // keeps the identity aligned with parseRules' one-entry-per-selector split.
  const idx = ruleMatch.matchingSelectors[0] ?? 0;
  const selector = normalizeSelector(
    rule.selectorList.selectors[idx]?.text ?? rule.selectorList.text,
  );
  const context = normalizeContext(
    [
      ...(rule.media ?? []).map((m) => `@media ${m.text}`),
      ...(rule.supports ?? []).map((s) => `@supports ${s.text}`),
      ...(rule.containerQueries ?? []).map(
        (c) => `@container ${c.conditionText}`,
      ),
    ].join(" / "),
  );
  return { context, selector, declarations };
}

async function matchedRulesFor(
  cdp: CDPSession,
  nodeId: number,
  libSheetIds: Set<string>,
): Promise<{ self: MatchedRule[]; pseudos: MatchedRule[][] }> {
  const res = await cdp.send("CSS.getMatchedStylesForNode", { nodeId });
  const self = (res.matchedCSSRules ?? [])
    .map((rm) => toMatchedRule(rm, libSheetIds))
    .filter((r): r is MatchedRule => r !== undefined);
  const pseudos: MatchedRule[][] = [];
  for (const pe of res.pseudoElements ?? []) {
    if (pe.pseudoType !== "before" && pe.pseudoType !== "after") continue;
    const list = pe.matches
      .map((rm) => toMatchedRule(rm, libSheetIds))
      .filter((r): r is MatchedRule => r !== undefined);
    if (list.length > 0) pseudos.push(list);
  }
  return { self, pseudos };
}

function record(
  agg: UsageAggregate,
  { self, pseudos }: { self: MatchedRule[]; pseudos: MatchedRule[][] },
): number {
  let observed = 0;
  if (self.length > 0) {
    recordObservation(agg, self);
    observed++;
  }
  for (const list of pseudos) {
    recordObservation(agg, list);
    observed++;
  }
  return observed;
}

// ---------------------------------------------------------------------------
// Per-page walk

function findBody(node: Protocol.DOM.Node): Protocol.DOM.Node | undefined {
  if (node.nodeName === "BODY") return node;
  for (const child of node.children ?? []) {
    const found = findBody(child);
    if (found) return found;
  }
  return undefined;
}

function descendantsOf(
  nodeId: number,
  childrenOf: Map<number, number[]>,
  cap: number,
): number[] {
  const out: number[] = [];
  const stack = [...(childrenOf.get(nodeId) ?? [])];
  while (stack.length > 0 && out.length < cap) {
    const id = stack.shift();
    if (id === undefined) break;
    out.push(id);
    stack.push(...(childrenOf.get(id) ?? []));
  }
  return out;
}

async function processPage(
  page: Page,
  agg: UsageAggregate,
  onLibraryCss: (text: string) => void,
): Promise<number> {
  const cdp = await page.context().newCDPSession(page);
  const sheets: Protocol.CSS.CSSStyleSheetHeader[] = [];
  cdp.on("CSS.styleSheetAdded", (e) => sheets.push(e.header));
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", {
    depth: -1,
    pierce: false,
  });

  // Svelte components sometimes target a `.bx--*` class directly in their
  // own scoped <style> (not wrapped in :global()), so more than one
  // `regular`-origin stylesheet can contain the substring: e.g. a component
  // override compiles to a tiny stylesheet like
  // `.bx--overflow-menu-options.svelte-xxxxx:after { ... }`. The real
  // library stylesheet (css/all.css) is orders of magnitude larger than any
  // such override, so the largest matching sheet wins the tie-break.
  const libSheetIds = new Set<string>();
  let library: { id: string; text: string } | undefined;
  for (const sheet of sheets) {
    if (sheet.origin !== "regular") continue;
    // biome-ignore lint/performance/noAwaitInLoops: small, bounded set of page stylesheets
    const { text } = await cdp.send("CSS.getStyleSheetText", {
      styleSheetId: sheet.styleSheetId,
    });
    if (
      text.includes(".bx--") &&
      (!library || text.length > library.text.length)
    ) {
      library = { id: sheet.styleSheetId, text };
    }
  }
  if (library) {
    libSheetIds.add(library.id);
    onLibraryCss(library.text);
  }

  const body = findBody(root);
  if (!body) {
    await cdp.detach();
    return 0;
  }

  const parentOf = new Map<number, number>();
  const childrenOf = new Map<number, number[]>();
  const elements: number[] = [];
  const collect = (node: Protocol.DOM.Node): void => {
    const kids = (node.children ?? []).filter((c) => c.nodeType === 1);
    childrenOf.set(
      node.nodeId,
      kids.map((k) => k.nodeId),
    );
    for (const kid of kids) {
      parentOf.set(kid.nodeId, node.nodeId);
      elements.push(kid.nodeId);
      collect(kid);
    }
  };
  collect(body);

  let observed = 0;
  for (const nodeId of elements) {
    // biome-ignore lint/performance/noAwaitInLoops: sequential by design (single CDP connection)
    const matched = await matchedRulesFor(cdp, nodeId, libSheetIds);
    observed += record(agg, matched);
  }

  if (STATES) {
    const { nodeIds: interactiveIds } = await cdp.send("DOM.querySelectorAll", {
      nodeId: body.nodeId,
      selector: INTERACTIVE,
    });
    for (const nodeId of interactiveIds.slice(0, MAX_STATE_ELEMENTS)) {
      for (const forced of Object.values(stateSets)) {
        // biome-ignore lint/performance/noAwaitInLoops: sequential by design
        await cdp.send("CSS.forcePseudoState", {
          nodeId,
          forcedPseudoClasses: forced,
        });
        const parent = parentOf.get(nodeId);
        const targets = [
          nodeId,
          ...(parent !== undefined && parent !== body.nodeId ? [parent] : []),
          ...descendantsOf(nodeId, childrenOf, MAX_STATE_DESCENDANTS),
        ];
        for (const target of targets) {
          // biome-ignore lint/performance/noAwaitInLoops: sequential by design
          const matched = await matchedRulesFor(cdp, target, libSheetIds);
          observed += record(agg, matched);
        }
        await cdp.send("CSS.forcePseudoState", {
          nodeId,
          forcedPseudoClasses: [],
        });
      }
    }
  }

  await cdp.detach();
  return observed;
}

// ---------------------------------------------------------------------------
// Report

function reportSection(title: string, lines: string[]): string {
  const capped = lines.slice(0, 200);
  const more =
    lines.length > 200
      ? `\n\n_(${lines.length - 200} more, capped at 200)_`
      : "";
  return `## ${title}\n\n${capped.length > 0 ? capped.join("\n") : "(none)"}${more}\n`;
}

function buildReport(
  summary: Summary,
  dead: ReturnType<typeof deadInFixtures>,
  fold: ReturnType<typeof foldCandidates>,
  unmatched: InventoryRule[],
): string {
  const foldSet = new Set(fold);
  const deadSorted = [...dead].sort((a, b) => bytesOf(b) - bytesOf(a));
  const deadLines = deadSorted.map((d) => {
    const top = Object.entries(d.lostTo).sort((a, b) => b[1] - a[1])[0];
    const ctx = d.context ? `${d.context} ` : "";
    const flag = foldSet.has(d) ? " **[fold candidate]**" : "";
    const value = `${d.value}${d.important ? " !important" : ""}`;
    const lost = top ? `lost ${top[1]}x to \`${top[0]}\`` : "no recorded loser";
    return `- \`${ctx}${d.selector}\` \`${d.property}: ${value}\` -- matched ${d.matched}x, ${lost}${flag}`;
  });

  const unmatchedSorted = [...unmatched].sort((a, b) => b.bytes - a.bytes);
  const unmatchedLines = unmatchedSorted.map((r) => {
    const ctx = r.context ? `${r.context} ` : "";
    return `- \`${ctx}${r.selector}\` { ${r.declText} } (~${r.bytes} bytes)`;
  });

  const summaryLines = [
    `- fixtures: ${summary.fixtures}, themes: ${summary.themes}, observations: ${summary.observations}`,
    `- rules: ${summary.rulesMatched} / ${summary.rulesTotal} matched at least once`,
    `- declarations: ${summary.declarationsTotal} total, ${summary.declarationsEverWon} ever won, ${summary.declarationsNeverWon} never won`,
    `- bytes never won (matched, dead in fixtures): ~${summary.bytesNeverWon}`,
    `- bytes in never-matched rules (no fixture coverage): ~${summary.bytesUnmatchedRules}`,
    `- fold candidates (always lose to one rule): ${fold.length}`,
  ];

  return `${[
    "# Cascade usage report",
    "",
    '_Bounded by `e2e/fixtures/*` coverage -- "never wins" and "never matched" are' +
      " evidence, not proof. See the header comment in `e2e/cascade-usage.ts`._",
    "",
    reportSection('1. Matched but never won ("dead in fixtures")', deadLines),
    reportSection(
      '2. Never matched any element ("unmatched"; evidence only, fixture coverage bounded)',
      unmatchedLines,
    ),
    reportSection("3. Summary", summaryLines),
  ].join("\n")}\n`;
}

// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  const { base, server } = await startServer(PORT, URL);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: VIEW_W, height: VIEW_H },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const names = await fixtures(ONLY);
  const agg = createAggregate();
  let libraryCss: string | undefined;
  const onLibraryCss = (text: string): void => {
    libraryCss ??= text;
  };
  const started = performance.now();
  try {
    for (const name of names) {
      for (const theme of THEMES) {
        // biome-ignore lint/performance/noAwaitInLoops: sequential by design
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
        await page.goto(`${base}/${name}.html`, { waitUntil: "networkidle" });
        const n = await processPage(page, agg, onLibraryCss);
        process.stdout.write(`${name} ${theme} ${n} observations\n`);
      }
    }
  } finally {
    await browser.close();
    server?.kill();
  }

  if (!libraryCss)
    throw new Error("never found the library stylesheet (.bx--)");
  const inventory = inventoryFromRules(parseRules(libraryCss));
  const summary = summarize(agg, inventory, names.length, THEMES.length);
  const dead = deadInFixtures(agg);
  const fold = foldCandidates(agg);
  const unmatched = neverMatchedRules(agg, inventory);

  await writeFile(
    `${OUT}/usage.json`,
    JSON.stringify(
      { summary, declarations: [...agg.declarations.values()], unmatched },
      null,
      2,
    ),
  );
  await writeFile(
    `${OUT}/report.md`,
    buildReport(summary, dead, fold, unmatched),
  );

  console.log(
    `\n${names.length} fixtures x ${THEMES.length} themes, ${agg.observations} observations ` +
      `in ${Math.round((performance.now() - started) / 1000)}s -> ${OUT}`,
  );
  console.log(
    `${summary.declarationsNeverWon}/${summary.declarationsTotal} declarations never won ` +
      `(~${summary.bytesNeverWon} bytes), ${summary.rulesTotal - summary.rulesMatched}/${summary.rulesTotal} rules never matched ` +
      `(~${summary.bytesUnmatchedRules} bytes), ${fold.length} fold candidates`,
  );
}

await run();
