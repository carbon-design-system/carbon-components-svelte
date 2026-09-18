/**
 * Pure aggregation + cascade-replay logic for e2e/cascade-usage.ts, kept
 * free of Playwright/CDP imports so it is unit-testable without a browser.
 *
 * The CLI feeds this module CDP `CSS.getMatchedStylesForNode` results (one
 * per element/pseudo/state observation). `matchedCSSRules` is ordered
 * lowest-to-highest cascade priority (later entries win; `!important` beats
 * normal regardless of order), so `cascadeWinners` replays that order per
 * longhand property: the winner is the last `!important` declaration if one
 * exists for that property, else the last normal one.
 *
 * Approximation: a matched declaration may be a shorthand ("padding: 0").
 * We expand it to the longhand properties it covers using CDP's own
 * `longhandProperties` field when present; when CDP doesn't supply it we
 * fall back to the static SHORTHANDS regex table shared with
 * scripts/lib/css-overrides.ts, matched against the *other* (implicit,
 * text-less) cssProperties entries CDP reports alongside the shorthand. If
 * neither source resolves any longhands, the declaration is treated as its
 * own (unexpanded) property -- reasonable for properties we don't model as
 * shorthands. A shorthand declaration counts as "won" on an element if it
 * wins ANY one of its longhands there: a partial override still means the
 * declaration had some visible effect, so it isn't reported as fully dead.
 *
 * "Never matched rule" identity (see `neverMatchedRules`) is `context +
 * selector` only, not the declaration block: if the exact same selector is
 * authored twice under the same media context (rare, but happens with
 * SCSS partials), evidence that either occurrence matched marks both as
 * matched. This under-reports rather than over-reports "unmatched" rules,
 * which is the safer direction for a tool whose claims are evidence, not
 * proof.
 */

import type { CssNode } from "css-tree";
import { generate, parse } from "css-tree";
import { SHORTHANDS } from "./css-overrides";

// ---------------------------------------------------------------------------
// CDP-shaped inputs (kept minimal + structurally compatible with
// Protocol.CSS.CSSProperty so real CDP responses can be passed in directly)

export interface CdpProperty {
  name: string;
  value: string;
  important?: boolean;
  text?: string;
  parsedOk?: boolean;
  disabled?: boolean;
  longhandProperties?: { name: string; value: string; important?: boolean }[];
}

// ---------------------------------------------------------------------------
// Declarations + rules

export interface Declaration {
  property: string;
  value: string;
  important: boolean;
  /** Longhand properties this declaration ultimately sets, for cascade replay. */
  longhands: string[];
}

export interface MatchedRule {
  /** Media/supports/container context, outermost first, joined with " / ". */
  context: string;
  selector: string;
  declarations: Declaration[];
}

const shorthandRe = (name: string): RegExp | undefined =>
  SHORTHANDS.find(([short]) => short === name)?.[1];

/**
 * Builds the authored declarations of a matched rule's style from CDP's
 * `cssProperties` list. Only entries with `text` are authored (implicit
 * longhand entries CDP expands from a shorthand have no `text` of their
 * own); disabled/unparsed entries are skipped entirely.
 */
export function authoredDeclarations(
  cssProperties: CdpProperty[],
): Declaration[] {
  const out: Declaration[] = [];
  for (const prop of cssProperties) {
    if (prop.disabled || prop.parsedOk === false || !prop.text) continue;
    let longhands: string[];
    if (prop.longhandProperties && prop.longhandProperties.length > 0) {
      longhands = prop.longhandProperties.map((l) => l.name);
    } else {
      const re = shorthandRe(prop.name);
      const siblings = re
        ? cssProperties.filter(
            (p) =>
              !p.text && !p.disabled && p.parsedOk !== false && re.test(p.name),
          )
        : [];
      longhands =
        siblings.length > 0 ? siblings.map((p) => p.name) : [prop.name];
    }
    out.push({
      property: prop.name,
      value: prop.value,
      important: Boolean(prop.important),
      longhands,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Normalization (so CDP-serialized selectors/media text compare equal to
// css-tree's generated output from the served stylesheet)

export function normalizeSelector(selector: string): string {
  try {
    return generate(parse(selector, { context: "selector" }) as CssNode);
  } catch {
    return selector.trim();
  }
}

/** Collapses whitespace so CDP's and css-tree's serializations of the same
 * at-rule prelude compare equal even if they format it slightly differently. */
export function normalizeContext(context: string): string {
  return context.replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Cascade replay

type Loc = [ruleIndex: number, declIndex: number];

/**
 * Per-longhand-property winner across one element/pseudo/state's matched
 * rules (already in lowest-to-highest cascade-priority order): the last
 * `!important` declaration for a property if any exists, else the last
 * normal one.
 */
export function cascadeWinners(rules: MatchedRule[]): Map<string, Loc> {
  const lastImportant = new Map<string, Loc>();
  const lastNormal = new Map<string, Loc>();
  for (const [ri, rule] of rules.entries()) {
    for (const [di, decl] of rule.declarations.entries()) {
      const bucket = decl.important ? lastImportant : lastNormal;
      for (const lh of decl.longhands) bucket.set(lh, [ri, di]);
    }
  }
  const winners = new Map<string, Loc>(lastNormal);
  for (const [lh, loc] of lastImportant) winners.set(lh, loc);
  return winners;
}

/** Per declaration, whether it won at least one of its longhands. */
export function replayWins(rules: MatchedRule[]): boolean[][] {
  const winners = cascadeWinners(rules);
  return rules.map((rule, ri) =>
    rule.declarations.map((decl, di) =>
      decl.longhands.some((lh) => {
        const w = winners.get(lh);
        return w !== undefined && w[0] === ri && w[1] === di;
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Aggregation

export interface DeclarationStats {
  context: string;
  selector: string;
  property: string;
  value: string;
  important: boolean;
  matched: number;
  won: number;
  /** Winning rule label (context + selector) -> number of losses to it. */
  lostTo: Record<string, number>;
}

export interface UsageAggregate {
  declarations: Map<string, DeclarationStats>;
  /** `${context}\0${selector}` for every rule that matched >=1 element. */
  matchedRuleKeys: Set<string>;
  observations: number;
}

export function createAggregate(): UsageAggregate {
  return {
    declarations: new Map(),
    matchedRuleKeys: new Set(),
    observations: 0,
  };
}

const ruleKey = (r: MatchedRule): string => `${r.context}\0${r.selector}`;
const declKey = (r: MatchedRule, d: Declaration): string =>
  `${r.context}\0${r.selector}\0${d.property}\0${d.value}\0${d.important}`;
const ruleLabel = (r: MatchedRule): string =>
  r.context ? `${r.context} ${r.selector}` : r.selector;

function statsFor(
  agg: UsageAggregate,
  rule: MatchedRule,
  decl: Declaration,
): DeclarationStats {
  const key = declKey(rule, decl);
  const existing = agg.declarations.get(key);
  if (existing) return existing;
  const stats: DeclarationStats = {
    context: rule.context,
    selector: rule.selector,
    property: decl.property,
    value: decl.value,
    important: decl.important,
    matched: 0,
    won: 0,
    lostTo: {},
  };
  agg.declarations.set(key, stats);
  return stats;
}

/**
 * Records one element/pseudo/state observation: `rules` is every author
 * rule from the library stylesheet matched on it, already in cascade order.
 */
export function recordObservation(
  agg: UsageAggregate,
  rules: MatchedRule[],
): void {
  agg.observations++;
  const winners = cascadeWinners(rules);
  for (const [ri, rule] of rules.entries()) {
    agg.matchedRuleKeys.add(ruleKey(rule));
    for (const [di, decl] of rule.declarations.entries()) {
      const stats = statsFor(agg, rule, decl);
      stats.matched++;
      const won = decl.longhands.some((lh) => {
        const w = winners.get(lh);
        return w !== undefined && w[0] === ri && w[1] === di;
      });
      if (won) {
        stats.won++;
        continue;
      }
      // Attribute the loss to whichever rule currently wins this
      // declaration's first longhand -- good enough to spot a single
      // recurring override source without modelling every longhand.
      const winnerLoc = winners.get(decl.longhands[0]);
      if (!winnerLoc) continue;
      const label = ruleLabel(rules[winnerLoc[0]]);
      stats.lostTo[label] = (stats.lostTo[label] ?? 0) + 1;
    }
  }
}

export const bytesOf = (d: { property: string; value: string }): number =>
  d.property.length + d.value.length + 2;

// The harness emulates `prefers-reduced-motion`, so a `transition` always
// loses to its own `transition: none` there. A rule gated on a user
// preference is an alternative, not an override.
const PREFERENCE_MEDIA_RE =
  /prefers-reduced-motion|prefers-contrast|forced-colors/;

/** A loss that only happens because of an emulated user preference. */
export const losesOnlyToPreferenceMedia = (d: DeclarationStats): boolean => {
  const winners = Object.keys(d.lostTo);
  return (
    winners.length > 0 && winners.every((w) => PREFERENCE_MEDIA_RE.test(w))
  );
};

/** Declarations that matched at least once but never won anywhere. */
export function deadInFixtures(agg: UsageAggregate): DeclarationStats[] {
  return [...agg.declarations.values()].filter(
    (d) => d.matched > 0 && d.won === 0 && !losesOnlyToPreferenceMedia(d),
  );
}

/** Dead declarations that always lose to the same single rule. */
export function foldCandidates(agg: UsageAggregate): DeclarationStats[] {
  return deadInFixtures(agg).filter((d) => Object.keys(d.lostTo).length === 1);
}

// ---------------------------------------------------------------------------
// Rule inventory (everything in the stylesheet, matched or not)

export interface InventoryRule {
  context: string;
  selector: string;
  declText: string;
  bytes: number;
}

/** Builds an inventory from scripts/lib/css-cascade.ts's `parseRules` output
 * (already split to one entry per individual selector, matching our rule
 * identity above). */
export function inventoryFromRules(
  rules: { context: string; selector: string; decls: Map<string, string> }[],
): InventoryRule[] {
  return rules.map((r) => {
    const entries = [...r.decls];
    return {
      context: normalizeContext(r.context),
      selector: r.selector,
      declText: entries.map(([p, v]) => `${p}: ${v}`).join("; "),
      bytes: entries.reduce((n, [p, v]) => n + p.length + v.length + 2, 0),
    };
  });
}

/** Inventory rules never observed matching any fixture element/state. */
export function neverMatchedRules(
  agg: UsageAggregate,
  inventory: InventoryRule[],
): InventoryRule[] {
  return inventory.filter(
    (r) => !agg.matchedRuleKeys.has(`${r.context}\0${r.selector}`),
  );
}

// ---------------------------------------------------------------------------
// Summary

export interface Summary {
  fixtures: number;
  themes: number;
  observations: number;
  rulesTotal: number;
  rulesMatched: number;
  declarationsTotal: number;
  declarationsEverWon: number;
  declarationsNeverWon: number;
  bytesNeverWon: number;
  bytesUnmatchedRules: number;
}

export function summarize(
  agg: UsageAggregate,
  inventory: InventoryRule[],
  fixtures: number,
  themes: number,
): Summary {
  const declarations = [...agg.declarations.values()];
  const neverWon = deadInFixtures(agg);
  const unmatched = neverMatchedRules(agg, inventory);
  return {
    fixtures,
    themes,
    observations: agg.observations,
    rulesTotal: inventory.length,
    rulesMatched: agg.matchedRuleKeys.size,
    declarationsTotal: declarations.length,
    declarationsEverWon: declarations.filter((d) => d.won > 0).length,
    declarationsNeverWon: neverWon.length,
    bytesNeverWon: neverWon.reduce((n, d) => n + bytesOf(d), 0),
    bytesUnmatchedRules: unmatched.reduce((n, r) => n + r.bytes, 0),
  };
}
