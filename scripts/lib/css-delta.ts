import { cascadeDiff, parseRules, type Rule } from "crassus";

// The sources a `css/` change can show up in, or why it can't be narrowed.
type StyleSeeds = { files: string[] } | { reason: string };

/**
 * Narrows a stylesheet change to the sources that can render it, so a `css/`
 * edit selects the e2e tests whose pages render a changed rule instead of
 * every test that loads `all.css`.
 *
 * A rule only matches on a page that renders every class its selector
 * requires, and every class a page renders is spelled in a source the page
 * imports: literally (`"bx--tag--red"`) or as a prefix before an
 * interpolation (`bx--tag--{type}`). So the sources spelling any one of a
 * rule's required classes cover every page it can match on; the rarest one
 * selects the fewest. Whatever breaks that chain is a reason to run
 * everything instead: a rule that requires no class (`:root`, `body`,
 * `@keyframes` steps, `:is(.a, div)`), a changed at-rule that isn't a style
 * rule (`@font-face`), or a rule whose required classes no source spells
 * (ones a dependency adds).
 */
export type StyleChange = { selectors: string[] } | { reason: string };

/** At-rules whose blocks hold style rules, which `parseRules` reads. */
const GROUPING = new Set([
  "media",
  "supports",
  "container",
  "layer",
  "scope",
  "starting-style",
  "document",
  "-moz-document",
]);
const KEYFRAMES = /^(?:-[a-z]+-)?keyframes$/;
const AT_RULE = /@([\w-]+)([^{};]*)([{;])/g;
const COMMENT = /\/\*[\s\S]*?\*\//g;
const WHITESPACE = /\s+/g;
const ANY_OF = /^:(?:is|where|matches|has|-webkit-any|-moz-any)\($/;
const PSEUDO_CALL = /^::?[\w-]+\(/;
const CLASS_NAME = /^(?:[\w-]|\\.)+/;
const ESCAPE = /\\(.)/g;
const DYNAMIC_PREFIX = /([A-Za-z_][\w-]*-)(?:\$\{|\{|["'`]\s*\+)/g;

/** Index just past the quote that closes the one at `open`. */
function skipString(text: string, open: number): number {
  for (let i = open + 1; i < text.length; i++) {
    if (text[i] === "\\") i++;
    else if (text[i] === text[open]) return i + 1;
  }
  return text.length;
}

/** Index just past the bracket that closes the one at `open`. */
function closing(text: string, open: number): number {
  const pairs: Record<string, string> = { "{": "}", "(": ")", "[": "]" };
  const stack: string[] = [];
  for (let i = open; i < text.length; i++) {
    const char = text[i];
    if (char === '"' || char === "'") i = skipString(text, i) - 1;
    else if (char === "\\") i++;
    else if (pairs[char]) stack.push(pairs[char]);
    else if (char === stack[stack.length - 1]) {
      stack.pop();
      if (stack.length === 0) return i + 1;
    }
  }
  return text.length;
}

/** Splits on commas outside brackets and strings. */
function splitTopLevel(list: string): string[] {
  const parts: string[] = [];
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const char = list[i];
    if (char === '"' || char === "'") i = skipString(list, i) - 1;
    else if (char === "(" || char === "[") i = closing(list, i) - 1;
    else if (char === ",") {
      parts.push(list.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(list.slice(start));
  return parts;
}

/**
 * What every element `selector` matches must have: each entry is a set of
 * classes, at least one of which is on the page. A class in a compound
 * outside `:not()` is one entry; an `:is()`/`:where()`/`:has()` whose every
 * alternative requires a class is another, with one class set from each.
 * Empty when no class is required.
 */
export function requiredClasses(selector: string): string[][] {
  const required: string[][] = [];
  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];
    if (char === "\\") i++;
    else if (char === '"' || char === "'") i = skipString(selector, i) - 1;
    else if (char === "[") i = closing(selector, i) - 1;
    else if (char === ".") {
      const name = selector.slice(i + 1).match(CLASS_NAME)?.[0];
      if (!name) continue;
      required.push([name.replace(ESCAPE, "$1")]);
      i += name.length;
    } else if (char === ":") {
      const call = selector.slice(i).match(PSEUDO_CALL)?.[0];
      if (!call) continue;
      const open = i + call.length - 1;
      const end = closing(selector, open);
      if (ANY_OF.test(call)) {
        const alternatives = splitTopLevel(selector.slice(open + 1, end - 1));
        const firsts = alternatives.map((alt) => requiredClasses(alt)[0]);
        if (firsts.every(Boolean)) required.push([...new Set(firsts.flat())]);
      }
      i = end - 1;
    }
  }
  return required;
}

/** At-rules other than style rules and their groups: `@font-face`, `@import`, … */
export function otherAtRules(css: string): string[] {
  const text = css.replace(COMMENT, "");
  const found: string[] = [];
  for (const match of text.matchAll(AT_RULE)) {
    const [whole, name, , end] = match;
    if (GROUPING.has(name) || KEYFRAMES.test(name)) continue;
    const start = match.index ?? 0;
    const stop =
      end === ";"
        ? start + whole.length
        : closing(text, start + whole.length - 1);
    found.push(text.slice(start, stop).replace(WHITESPACE, " ").trim());
  }
  return found.sort();
}

function describe(rule: Rule): string {
  return rule.context ? `${rule.context} { ${rule.selector} }` : rule.selector;
}

/** The selector of every rule that differs between two compiled stylesheets. */
export function changedSelectors(base: string, head: string): StyleChange {
  const before = otherAtRules(base);
  const after = otherAtRules(head);
  const at =
    after.find((rule, i) => rule !== before[i]) ?? before[after.length];
  if (at !== undefined) return { reason: `"${at.slice(0, 80)}" changed` };

  const diff = cascadeDiff(parseRules(base), parseRules(head));
  const rules = [
    ...diff.removed,
    ...diff.added,
    ...diff.movedHead,
    ...diff.rewrites.keys(),
    ...diff.rewrites.values(),
    ...diff.contextMoves.keys(),
    ...diff.contextMoves.values(),
  ];
  const selectors = new Set<string>();
  for (const rule of rules) {
    if (requiredClasses(rule.selector).length === 0) {
      return { reason: `"${describe(rule)}" requires no class` };
    }
    selectors.add(rule.selector);
  }
  return { selectors: [...selectors].sort() };
}

/** Looks up the sources that spell a class, literally or as a prefix. */
function spellers(sources: Map<string, string>) {
  const prefixes = new Map<string, string[]>();
  for (const [file, source] of sources) {
    prefixes.set(
      file,
      [...source.matchAll(DYNAMIC_PREFIX)].map(([, prefix]) => prefix),
    );
  }
  const cache = new Map<string, string[]>();
  return (name: string): string[] => {
    let files = cache.get(name);
    if (!files) {
      files = [...sources.keys()].filter(
        (file) =>
          sources.get(file)?.includes(name) ||
          prefixes.get(file)?.some((prefix) => name.startsWith(prefix)),
      );
      cache.set(name, files);
    }
    return files;
  };
}

/**
 * The sources that can render a rule with one of `selectors`: for each, the
 * spellers of its rarest required class set whose classes are all spelled.
 */
export function selectorSources(
  sources: Map<string, string>,
  selectors: string[],
): StyleSeeds {
  const spelledBy = spellers(sources);
  const files = new Set<string>();
  for (const selector of selectors) {
    let rarest: Set<string> | undefined;
    for (const names of requiredClasses(selector)) {
      const users = names.map(spelledBy);
      if (users.some((list) => list.length === 0)) continue;
      const union = new Set(users.flat());
      if (!rarest || union.size < rarest.size) rarest = union;
    }
    if (!rarest) {
      return { reason: `no source spells a class "${selector}" requires` };
    }
    for (const file of rarest) files.add(file);
  }
  return { files: [...files].sort() };
}
