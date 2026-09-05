/**
 * Static cascade checker for `css/all.scss` refactors.
 *
 * Compiles `css/all.scss` at a base git ref and in the working tree, then:
 *
 * 1. Reports the rule multiset delta (added / removed selectors, keyed by
 *    media context + selector + declaration block).
 * 2. Maps each removed rule to an added rule with the same declaration block
 *    (a "rewrite": the selector changed, the styles did not) and, for every
 *    rewritten or genuinely new rule, checks whether its winner/loser
 *    relationship against any co-matchable rule with a conflicting property
 *    flipped between base and head. A flip is a cascade regression candidate.
 * 3. Finds rules whose key is unchanged but whose position moved (a partial
 *    relocated to its component's slot) and lists the equal-specificity
 *    ties they now win or lose as a review section. These do not fail the
 *    run: the static model cannot tell whether both selectors ever match one
 *    element, so e2e/cascade-snapshot.ts is the gate for them.
 * 4. Prints a specificity profile (selectors with >= 4 classes, max) so the
 *    number is visible per PR.
 *
 * Co-matchability is a heuristic on the subject (last) compound: two
 * selectors can match the same element when their pseudo-elements agree,
 * their class sets intersect (or one has none), and neither negates a class
 * the other requires. Descendant context is ignored, so the check
 * over-reports; the computed-style snapshot (e2e/cascade-snapshot.ts) is
 * the ground truth for anything flagged here.
 *
 *   bun scripts/check-css-cascade.ts            # base = HEAD
 *   bun scripts/check-css-cascade.ts --base master
 *   bun scripts/check-css-cascade.ts --base master --entry all
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { $ } from "bun";
import { initAsyncCompiler } from "sass-embedded";
import {
  candidates,
  coMatchable,
  compareSpecificity,
  conflictingProps,
  indexBySubject,
  parseRules,
  type Rule,
  type Specificity,
  wins,
} from "./lib/css-cascade";

const args = process.argv.slice(2);
function flag(name: string, fallback: string): string {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const BASE_REF = flag("base", "HEAD");
const ENTRY = flag("entry", "all");
const VERBOSE = args.includes("--verbose");
const PREFIX_RE = /^[a-z]+--/;
const ROOT_SPLIT_RE = /__|--/;

// ---------------------------------------------------------------------------
// Compile

async function compileAt(cssDir: string): Promise<string> {
  const compiler = await initAsyncCompiler();
  try {
    const { css } = await compiler.compileAsync(
      path.join(cssDir, `${ENTRY}.scss`),
      {
        style: "expanded",
        loadPaths: [path.join(cssDir, "vendor")],
        quietDeps: true,
        silenceDeprecations: [
          "import",
          "global-builtin",
          "color-functions",
          "if-function",
        ],
      },
    );
    return css;
  } finally {
    await compiler.dispose();
  }
}

async function compileRef(ref: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "ccs-cascade-"));
  try {
    await $`git archive ${ref} css | tar -x -C ${dir}`.quiet();
    return await compileAt(path.join(dir, "css"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Main

function fmtSpec(s: Specificity): string {
  return `(${s.join(",")})`;
}

const [baseCss, headCss] = await Promise.all([
  compileRef(BASE_REF),
  compileAt("css"),
]);
const base = parseRules(baseCss);
const head = parseRules(headCss);

// 1. Multiset delta ---------------------------------------------------------
const count = (rules: Rule[]) => {
  const m = new Map<string, Rule[]>();
  for (const r of rules) {
    const list = m.get(r.key);
    if (list) list.push(r);
    else m.set(r.key, [r]);
  }
  return m;
};
const baseByKey = count(base);
const headByKey = count(head);
const removed: Rule[] = [];
const added: Rule[] = [];
for (const [key, list] of baseByKey) {
  const h = headByKey.get(key)?.length ?? 0;
  for (let i = h; i < list.length; i++) removed.push(list[i]);
}
for (const [key, list] of headByKey) {
  const b = baseByKey.get(key)?.length ?? 0;
  for (let i = b; i < list.length; i++) added.push(list[i]);
}

// 2. Rewrites: removed -> added with identical decl block + context ---------
const rewrites = new Map<Rule, Rule>(); // head rule -> base rule
const unmatchedAdded: Rule[] = [];
const removedPool = [...removed];
const shareClass = (a: Rule, b: Rule): boolean => {
  for (const c of a.subject.allClasses)
    if (b.subject.allClasses.has(c)) return true;
  return false;
};
for (const a of added) {
  const i = removedPool.findIndex(
    (r) =>
      r.declBlock === a.declBlock &&
      r.context === a.context &&
      shareClass(r, a),
  );
  if (i >= 0) {
    rewrites.set(a, removedPool[i]);
    removedPool.splice(i, 1);
  } else {
    unmatchedAdded.push(a);
  }
}

// Map base rules -> head rules for pair comparison: identical keys map in
// order; rewrites map explicitly.
const baseToHead = new Map<Rule, Rule>();
for (const [key, hlist] of headByKey) {
  const blist = baseByKey.get(key) ?? [];
  for (let i = 0; i < Math.min(hlist.length, blist.length); i++) {
    baseToHead.set(blist[i], hlist[i]);
  }
}
for (const [h, b] of rewrites) baseToHead.set(b, h);
const headToBase = new Map<Rule, Rule>();
for (const [b, h] of baseToHead) headToBase.set(h, b);

const headIndex = indexBySubject(head);

interface Flip {
  rule: Rule;
  other: Rule;
  otherBase: Rule | undefined;
  prop: string;
  before: string;
  after: string;
}
const flips: Flip[] = [];
const moveFlips: Flip[] = [];
const reviews: { rule: Rule; other: Rule; prop: string; result: string }[] = [];

// `bx--slider__thumb--lower` -> `slider`; used to skip pairing a moved rule
// with rules from components it shares no class root with.
const rootOf = (cls: string): string =>
  cls.replace(PREFIX_RE, "").split(ROOT_SPLIT_RE)[0];
const roots = (r: Rule): Set<string> =>
  new Set([...r.subject.allClasses].map(rootOf));
const shareRoot = (a: Rule, b: Rule): boolean => {
  const ra = roots(a);
  for (const r of roots(b)) if (ra.has(r)) return true;
  return false;
};

// Rules whose key is unchanged but whose position moved relative to the
// others (a partial relocated to its component's slot). Found as the
// complement of the longest common subsequence of shared keys, so only the
// rules that actually jumped are checked, not everything after them.
const movedHead = new Set<Rule>();
{
  const headPos: number[] = [];
  const headRules: Rule[] = [];
  for (const b of base) {
    const h = baseToHead.get(b);
    if (!h) continue;
    headPos.push(head.indexOf(h));
    headRules.push(h);
  }
  // Longest increasing subsequence over head positions (patience sorting).
  const tails: number[] = [];
  const tailIdx: number[] = [];
  const prev: number[] = new Array(headPos.length).fill(-1);
  for (let i = 0; i < headPos.length; i++) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < headPos[i]) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = headPos[i];
    tailIdx[lo] = i;
    prev[i] = lo > 0 ? tailIdx[lo - 1] : -1;
  }
  const stable = new Set<number>();
  for (
    let i = tailIdx[tails.length - 1];
    i !== undefined && i >= 0;
    i = prev[i]
  ) {
    stable.add(i);
  }
  headRules.forEach((h, i) => {
    if (!stable.has(i)) movedHead.add(h);
  });
}

const changedHead = new Set<Rule>([
  ...rewrites.keys(),
  ...unmatchedAdded,
  ...movedHead,
]);
for (const rule of changedHead) {
  const ruleBase = headToBase.get(rule);
  for (const other of candidates(rule, headIndex)) {
    if (!coMatchable(rule, other)) continue;
    const props = conflictingProps(rule, other);
    if (props.length === 0) continue;
    const otherBase = headToBase.get(other);
    const isMoveOnly = movedHead.has(rule) && !rewrites.has(rule);
    if (isMoveOnly && !shareRoot(rule, other)) continue;
    for (const prop of props) {
      const after = wins(rule, other, prop) ? "wins" : "loses";
      if (ruleBase && otherBase) {
        const before = wins(ruleBase, otherBase, prop) ? "wins" : "loses";
        if (before !== after) {
          (isMoveOnly ? moveFlips : flips).push({
            rule,
            other,
            otherBase,
            prop,
            before,
            after,
          });
        }
      } else if (VERBOSE) {
        reviews.push({ rule, other, prop, result: after });
      }
    }
  }
}

// 3. Specificity profile ----------------------------------------------------
function profile(rules: Rule[]) {
  let heavy = 0;
  let max: Specificity = [0, 0, 0];
  for (const r of rules) {
    if (r.specificity[1] >= 4) heavy++;
    if (compareSpecificity(r.specificity, max) > 0) max = r.specificity;
  }
  return { selectors: rules.length, heavy, max };
}
const pb = profile(base);
const ph = profile(head);

// Report -------------------------------------------------------------------
const lines: string[] = [];
lines.push(`base: ${BASE_REF}  head: working tree  entry: css/${ENTRY}.scss`);
lines.push(
  `selectors: ${pb.selectors} -> ${ph.selectors}  ` +
    `>=4 classes: ${pb.heavy} -> ${ph.heavy}  ` +
    `max: ${fmtSpec(pb.max)} -> ${fmtSpec(ph.max)}`,
);
lines.push(
  `removed: ${removed.length}  added: ${added.length}  ` +
    `rewrites (same decls, new selector): ${rewrites.size}  ` +
    `new rules: ${unmatchedAdded.length}  dropped rules: ${removedPool.length}  ` +
    `moved rules: ${movedHead.size}`,
);

const section = (title: string, items: string[]) => {
  if (items.length === 0) return;
  lines.push("", `## ${title} (${items.length})`);
  lines.push(...items);
};

section(
  "dropped rules (in base, no head rule with the same declarations)",
  removedPool.map(
    (r) =>
      `  - ${r.context ? `[${r.context}] ` : ""}${r.selector} { ${r.declBlock} }`,
  ),
);
section(
  "new rules (in head, no base rule with the same declarations)",
  unmatchedAdded.map(
    (r) =>
      `  + ${r.context ? `[${r.context}] ` : ""}${r.selector} { ${r.declBlock} }`,
  ),
);
section(
  "rewrites",
  [...rewrites].map(
    ([h, b]) =>
      `  ${b.selector} ${fmtSpec(b.specificity)}\n    -> ${h.selector} ${fmtSpec(h.specificity)}`,
  ),
);
section(
  "CASCADE FLIPS (winner changed against a co-matchable rule)",
  flips.map(
    (f) =>
      `  ${f.rule.selector} ${fmtSpec(f.rule.specificity)} now ${f.after} '${f.prop}' vs\n` +
      `    ${f.other.selector} ${fmtSpec(f.other.specificity)}` +
      (f.otherBase && f.otherBase.selector !== f.other.selector
        ? ` (was ${f.otherBase.selector})`
        : "") +
      `\n    (before: ${f.before})`,
  ),
);
// Moved rules only change order, so these are equal-specificity ties whose
// winner now depends on the new position. The static model cannot tell
// whether both selectors ever match one element; confirm with the snapshot.
{
  const byRule = new Map<Rule, Flip[]>();
  for (const f of moveFlips) {
    const list = byRule.get(f.rule);
    if (list) list.push(f);
    else byRule.set(f.rule, [f]);
  }
  section(
    "order-tie flips from moved rules (review; confirm with e2e/cascade-snapshot.ts)",
    [...byRule].map(([rule, list]) => {
      const others = [...new Set(list.map((f) => f.other.selector))];
      const props = [...new Set(list.map((f) => f.prop))];
      return (
        `  ${rule.selector} ${fmtSpec(rule.specificity)} now ${list[0].after} [${props.join(", ")}] vs
` +
        others
          .slice(0, 4)
          .map((o) => `    ${o}`)
          .join("\n") +
        (others.length > 4 ? `\n    (+${others.length - 4} more)` : "")
      );
    }),
  );
}

if (VERBOSE) {
  section(
    "review: new rules vs co-matchable conflicting rules",
    reviews.map(
      (r) =>
        `  ${r.rule.selector} ${fmtSpec(r.rule.specificity)} ${r.result} '${r.prop}' vs ${r.other.selector} ${fmtSpec(r.other.specificity)}`,
    ),
  );
}

console.log(lines.join("\n"));
if (flips.length > 0) {
  console.error(`\n${flips.length} cascade flip(s); inspect before merging.`);
  process.exit(1);
}
