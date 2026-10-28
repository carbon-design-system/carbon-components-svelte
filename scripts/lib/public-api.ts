// No imports: the PR labels workflow loads this file from the base branch
// with plain Node, which strips the types, before any install.

/** The PR title types that may not add public API. */
export const NON_FEATURE_TYPES = ["fix", "chore", "refactor", "perf"];

/** One file of a PR, with its text at the merge base and at the head. */
export type ChangedFile = { path: string; base: string; head: string };

/** One piece of public API the head adds, such as `prop open`. */
export type Addition = { path: string; api: string };

const TITLE = /^(\w+)(?:\([^)]*\))?(!)?:/;
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:/m;
const COMPONENT = /^src\/.+\.svelte$/;

const EXPORT = /^\s*export\s+(let|const|function)\s+([\w$]+)/gm;
const JSDOC = /\/\*\*[\s\S]*?\*\//g;
const JSDOC_MARGIN = /^\s*\/?\*+\/?/gm;
const TAG = /@(slot|event|typedef|property)\b/g;
const LEADING_SPACE = /^[ \t]*/;
const TAG_NAME = /^[ \t]*\[?([\w$:-]+)/;
const OBJECT_TYPE = /^\{[\s\S]*\}$/;
const OBJECT_KEY = /^\s*(?:readonly\s+)?([\w$]+)\??\s*[:(]/;

const SLOT = /<slot(?=[\s/>])([^>]*)>/g;
const SLOT_NAME = /\bname="([^"]+)"/;
const FORWARDED_EVENT = /\son:([\w-]+)(?:\|[\w|]+)?(?=\s|\/?>)/g;
const DISPATCH = /\bdispatch\(\s*["']([^"']+)["']/g;

// Where markup stops: a script or style block, or an HTML comment.
const NOT_MARKUP: [string, string][] = [
  ["<script", "</script"],
  ["<style", "</style"],
  ["<!--", "-->"],
];

/**
 * The markup of a component, with its scripts, styles and comments
 * blanked to spaces so offsets still line up. A plain scan, not a regex:
 * this reads a file, it does not sanitize HTML.
 */
function markupOf(source: string) {
  const lower = source.toLowerCase();
  let markup = "";
  let at = 0;
  while (at < source.length) {
    const next = NOT_MARKUP.map(([open, close]) => ({
      start: lower.indexOf(open, at),
      close,
    }))
      .filter(({ start }) => start !== -1)
      .sort((a, b) => a.start - b.start)[0];
    if (!next) break;
    const end = lower.indexOf(next.close, next.start);
    const stop = end === -1 ? source.length : end + next.close.length;
    markup += source.slice(at, next.start) + " ".repeat(stop - next.start);
    at = stop;
  }
  return markup + source.slice(at);
}

/** The type of a conventional commit title, and whether it breaks. */
export function parseTitle(title: string, body = "") {
  const match = TITLE.exec(title);
  return {
    type: match?.[1],
    breaking: Boolean(match?.[2]) || BREAKING_FOOTER.test(body),
  };
}

/** Reads the `{...}` that starts at `start`, braces balanced. */
function braced(text: string, start: number) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  return text.slice(start);
}

/** The top-level keys of an object type such as `{ a: T; b?: U }`. */
function objectKeys(type: string) {
  if (!OBJECT_TYPE.test(type) || braced(type, 0) !== type) return [];
  const keys: string[] = [];
  let depth = 0;
  let part = "";
  for (const char of `${type.slice(1, -1)};`) {
    if ("([{".includes(char)) depth++;
    else if (")]}".includes(char)) depth--;
    if (depth === 0 && (char === ";" || char === ",")) {
      const key = OBJECT_KEY.exec(part)?.[1];
      if (key) keys.push(key);
      part = "";
    } else {
      part += char;
    }
  }
  return keys;
}

/**
 * The public API a component declares, as `kind name` strings: props and
 * accessors, slots, events, and the fields of its typedefs, event details
 * and slot props. Reads the JSDoc sveld reads and the markup sveld infers
 * from (`<slot>`, forwarded `on:` events, `dispatch()`).
 */
export function publicApi(source: string) {
  const api = new Set<string>();

  for (const [, kind, name] of source.matchAll(EXPORT)) {
    api.add(`${kind === "let" ? "prop" : "export"} ${name}`);
  }

  for (const [block] of source.matchAll(JSDOC)) {
    const text = block.replace(JSDOC_MARGIN, "");
    // A `@property` belongs to the `@typedef` or `@event` above it.
    let owner = "";
    for (const tag of text.matchAll(TAG)) {
      let rest = text
        .slice((tag.index ?? 0) + tag[0].length)
        .replace(LEADING_SPACE, "");
      let type = "";
      if (rest.startsWith("{")) {
        type = braced(rest, 0);
        rest = rest.slice(type.length);
        type = type.slice(1, -1).trim();
      }
      // The name sits on the line the type ends on. A bare `@slot` or one
      // followed by `- description` is the default slot.
      let name = TAG_NAME.exec(rest)?.[1] ?? "";
      if (tag[1] === "slot" && (!name || name === "-")) name = "default";
      if (!name) continue;

      if (tag[1] === "property") {
        if (owner) api.add(`field ${owner}.${name}`);
        continue;
      }
      owner = tag[1] === "typedef" ? name : `${tag[1]} ${name}`;
      if (tag[1] !== "typedef") api.add(owner);
      for (const key of objectKeys(type)) api.add(`field ${owner}.${key}`);
    }
  }

  const markup = markupOf(source);
  for (const [, attrs] of markup.matchAll(SLOT)) {
    api.add(`slot ${SLOT_NAME.exec(attrs)?.[1] ?? "default"}`);
  }
  for (const [, name] of markup.matchAll(FORWARDED_EVENT)) {
    api.add(`event ${name}`);
  }
  for (const [, name] of source.matchAll(DISPATCH)) {
    api.add(`event ${name}`);
  }

  return api;
}

/** The public API in `head` that `base` lacks. */
export function addedApi(base: string, head: string) {
  const before = publicApi(base);
  return [...publicApi(head)].filter((api) => !before.has(api)).sort();
}

/**
 * The public API a PR adds under a title type that is not `feat`. Empty
 * for `feat`, `docs` and the like, and for a breaking change: its `!` or
 * footer already puts it in the release notes, and a renamed prop reads
 * as an added one.
 */
export function misfiledApi(
  title: string,
  body: string,
  files: ChangedFile[],
): Addition[] {
  const { type, breaking } = parseTitle(title, body);
  if (!type || !NON_FEATURE_TYPES.includes(type) || breaking) return [];
  return files.flatMap(({ path, base, head }) =>
    addedApi(base, head).map((api) => ({ path, api })),
  );
}

/** Whether a changed file can declare component API. */
export function isComponent(path: string) {
  return COMPONENT.test(path);
}
