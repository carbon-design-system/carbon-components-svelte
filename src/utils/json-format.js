// @ts-check
// How `JsonViewer` writes a node: its key, its value or collapsed summary, the
// text a search reads, and the text a copy writes.

import { formatPath, pathSegments } from "./json-path.js";
import {
  ARRAY,
  BIGINT,
  BOOLEAN,
  CHUNK,
  CIRCULAR,
  DATE,
  ERROR,
  FUNCTION,
  LONG_STRING,
  MAP,
  NULL,
  NUMBER,
  OBJECT,
  OPAQUE,
  REGEXP,
  SET,
  STRING,
  SYMBOL,
  THROWS,
  UNDEFINED,
} from "./json-tree.js";

/**
 * Group digits by thousands, the same on the server and in the browser.
 * @param {number} count
 * @returns {string}
 */
export function formatCount(count) {
  return String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * @param {number} count
 * @param {string} one
 * @param {string} many
 * @returns {string}
 */
function counted(count, one, many) {
  return `${formatCount(count)} ${count === 1 ? one : many}`;
}

/**
 * The class name of a value that is not a plain object or array, or "".
 * @param {unknown} value
 * @param {string} plain
 * @returns {string}
 */
function className(value, plain) {
  try {
    const name = Object.getPrototypeOf(value)?.constructor?.name;
    return typeof name === "string" && name !== plain ? name : "";
  } catch {
    return "";
  }
}

/**
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {number} id
 * @returns {string} The collapsed summary of a container, such as `{5 keys}`.
 */
function summarize(tree, id) {
  const value = /** @type {any} */ (tree.values[id]);
  const count = tree.childCount(id);
  switch (tree.kinds[id]) {
    case OBJECT: {
      const name = className(value, "Object");
      const body = count === 0 ? "{}" : `{${counted(count, "key", "keys")}}`;
      return name ? `${name} ${body}` : body;
    }
    case ARRAY: {
      const name = className(value, "Array");
      const body = count === 0 ? "[]" : `[${counted(count, "item", "items")}]`;
      return name ? `${name} ${body}` : body;
    }
    case MAP:
      return count === 0
        ? "Map {}"
        : `Map {${counted(count, "entry", "entries")}}`;
    case SET:
      return count === 0
        ? "Set {}"
        : `Set {${counted(count, "item", "items")}}`;
    case ERROR: {
      const message = String(value.message ?? "").split("\n", 1)[0];
      const name = String(value.name ?? "Error");
      return message ? `${name}: ${message}` : name;
    }
  }
  return "";
}

/**
 * @param {string} text
 * @returns {string} `text` as the inside of a JSON string.
 */
function escapeString(text) {
  return JSON.stringify(text).slice(1, -1);
}

/**
 * The part of a long string a row shows. A string that matches a search past
 * the cut shows the match, so the highlight is not hidden by the ellipsis.
 * @param {string} text
 * @param {number} max
 * @param {string} query
 * @returns {{ body: string; before: boolean; after: boolean }}
 */
export function stringWindow(text, max, query) {
  let start = 0;
  if (query) {
    const at = text.toLowerCase().indexOf(query.toLowerCase());
    if (at + query.length > max) start = Math.max(0, at - 20);
  }
  const end = start + max;
  return {
    body: escapeString(text.slice(start, end)),
    before: start > 0,
    after: end < text.length,
  };
}

/**
 * @typedef {object} ValueText
 * @property {string} text What the row shows for the value.
 * @property {string} [hint] A muted note after it, such as a string's length.
 */

/**
 * The value of a node as a row shows it.
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {number} id
 * @param {string} [query] The active search, for a match in a long string.
 * @returns {ValueText}
 */
export function valueText(tree, id, query = "") {
  const value = /** @type {any} */ (tree.values[id]);
  switch (tree.kinds[id]) {
    case NULL:
      return { text: "null" };
    case UNDEFINED:
      return { text: "undefined" };
    case BOOLEAN:
      return { text: String(value) };
    case NUMBER:
      return { text: Object.is(value, -0) ? "-0" : String(value) };
    case BIGINT:
      return { text: `${value}n` };
    case STRING:
      return { text: JSON.stringify(value) };
    case LONG_STRING: {
      const { body, before, after } = stringWindow(
        value,
        tree.maxStringLength,
        query,
      );
      return {
        text: `"${before ? "…" : ""}${body}${after ? "…" : ""}"`,
        hint: `${formatCount(value.length)} chars`,
      };
    }
    case CHUNK:
      return { text: escapeString(tree.chunkText(id)) };
    case SYMBOL:
      return { text: String(value) };
    case FUNCTION:
      return { text: `ƒ ${value.name || "anonymous"}()` };
    case DATE:
      return {
        text: Number.isNaN(value.getTime())
          ? "Invalid Date"
          : `Date ${value.toISOString()}`,
      };
    case REGEXP:
      return { text: String(value) };
    case OPAQUE:
      return { text: className(value, "") || "Object" };
    case THROWS:
      return { text: `[Throws: ${String(value?.message ?? value)}]` };
    case CIRCULAR: {
      const target = tree.firsts[id];
      return {
        text: `[Circular → ${formatPath(pathSegments(tree, target))}]`,
      };
    }
  }
  return { text: summarize(tree, id) };
}

/**
 * @typedef {object} KeyText
 * @property {string} text The key as a row shows it, or "" for none.
 * @property {"root" | "key" | "index" | "none"} role
 */

/**
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {number} id
 * @param {string} [rootLabel]
 * @returns {KeyText}
 */
export function keyText(tree, id, rootLabel = "$") {
  const parent = tree.parents[id];
  if (parent < 0) return { text: rootLabel, role: "root" };
  const key = tree.keys[id];
  switch (tree.kinds[parent]) {
    case LONG_STRING:
      return { text: "", role: "none" };
    case ARRAY:
    case SET:
      return { text: String(key), role: "index" };
    case MAP:
      return typeof key === "object" && key !== null
        ? { text: `Entry ${tree.indexOf(id)}`, role: "index" }
        : {
            text: typeof key === "string" ? JSON.stringify(key) : String(key),
            role: "key",
          };
  }
  return { text: String(key), role: "key" };
}

/**
 * The text a search reads for a node's value, or "" for a container.
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {number} id
 * @returns {string}
 */
export function searchValueText(tree, id) {
  const value = /** @type {any} */ (tree.values[id]);
  switch (tree.kinds[id]) {
    case STRING:
    case LONG_STRING:
      return value;
    case NULL:
      return "null";
    case UNDEFINED:
      return "undefined";
    case BOOLEAN:
    case NUMBER:
    case SYMBOL:
    case REGEXP:
      return String(value);
    case BIGINT:
      return String(value);
    case DATE:
      return Number.isNaN(value.getTime())
        ? "Invalid Date"
        : value.toISOString();
    case FUNCTION:
      return value.name;
    case THROWS:
      return String(value?.message ?? value);
  }
  return "";
}

/**
 * The text a search reads for a node's key. Array indexes do not count: a
 * search for "3" should find the 3, not every fourth item.
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {number} id
 * @returns {string}
 */
export function searchKeyText(tree, id) {
  const parent = tree.parents[id];
  if (parent < 0) return "";
  switch (tree.kinds[parent]) {
    case OBJECT:
    case ERROR:
      return String(tree.keys[id]);
    case MAP: {
      const key = tree.keys[id];
      return typeof key === "object" && key !== null ? "" : String(key);
    }
  }
  return "";
}

/**
 * @typedef {{ text: string; match: boolean }} TextPart
 */

/**
 * Split `text` around every case-insensitive occurrence of `query`.
 * @param {string} text
 * @param {string} query
 * @returns {TextPart[]}
 */
export function splitMatches(text, query) {
  if (!query || !text) return [{ text, match: false }];
  let hay = text.toLowerCase();
  // A few characters change length when lowercased, which would shift every
  // index after them.
  if (hay.length !== text.length) hay = text;
  const needle = hay === text ? query : query.toLowerCase();
  /** @type {TextPart[]} */
  const parts = [];
  let from = 0;
  for (;;) {
    const at = hay.indexOf(needle, from);
    if (at < 0) break;
    if (at > from) parts.push({ text: text.slice(from, at), match: false });
    parts.push({ text: text.slice(at, at + needle.length), match: true });
    from = at + needle.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false });
  return parts.length ? parts : [{ text, match: false }];
}

/**
 * Plain JSON for the structures `JSON.stringify` cannot write: cycles,
 * BigInt, Map, Set, errors, typed arrays and symbols.
 * @returns {(this: unknown, key: string, value: unknown) => unknown}
 */
function createReplacer() {
  /** @type {unknown[]} */
  const stack = [];
  /** @type {WeakMap<object, unknown>} */
  const origin = new WeakMap();

  return function replacer(_key, value) {
    if (typeof value === "bigint") return `${value}n`;
    if (typeof value === "symbol") return String(value);
    if (typeof value === "function") return `ƒ ${value.name || "anonymous"}()`;
    if (typeof value !== "object" || value === null) return value;

    const holder = origin.get(/** @type {object} */ (this)) ?? this;
    while (stack.length > 0 && stack[stack.length - 1] !== holder) stack.pop();
    if (stack.includes(value)) return "[Circular]";
    stack.push(value);

    /** @type {unknown} */
    let out = value;
    if (value instanceof Map) {
      const entries = [...value];
      out = entries.every(([k]) => typeof k === "string")
        ? Object.fromEntries(entries)
        : entries;
    } else if (value instanceof Set) {
      out = [...value];
    } else if (value instanceof RegExp) {
      out = String(value);
    } else if (value instanceof Error) {
      /** @type {Record<string, unknown>} */
      const fields = {};
      for (const key of ["name", "message", "stack"]) {
        if (typeof (/** @type {any} */ (value)[key]) === "string")
          fields[key] = /** @type {any} */ (value)[key];
      }
      out = Object.assign(fields, value);
    } else if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
      out = Array.from(
        /** @type {ArrayLike<number>} */ (/** @type {unknown} */ (value)),
      );
    }
    if (out !== value) origin.set(/** @type {object} */ (out), value);
    return out;
  };
}

/**
 * The text "Copy value" writes: a string as itself, any other primitive as
 * the viewer shows it, and a container as indented JSON.
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {number} id
 * @param {number} [space]
 * @returns {string}
 */
export function serializeValue(tree, id, space = 2) {
  let node = id;
  if (tree.kinds[node] === CHUNK) node = tree.parents[node];
  const value = tree.values[node];
  switch (tree.kinds[node]) {
    case STRING:
    case LONG_STRING:
      return /** @type {string} */ (value);
    case OBJECT:
    case ARRAY:
    case MAP:
    case SET:
    case ERROR:
      return (
        JSON.stringify(value, createReplacer(), space) ??
        valueText(tree, node).text
      );
  }
  return valueText(tree, node).text;
}
