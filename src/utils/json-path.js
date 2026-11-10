// @ts-check
// Paths into a `JsonTree`: `$.a.b[3]` (JSONPath) and `data.a.b[3]` (JavaScript).

import {
  ARRAY,
  CHUNK,
  ERROR,
  LONG_STRING,
  MAP,
  OBJECT,
  SET,
} from "./json-tree.js";

/**
 * @typedef {{ type: "key"; key: string }
 *   | { type: "index"; index: number }
 *   | { type: "get"; key: unknown }
 *   | { type: "entry"; index: number }
 *   | { type: "item"; index: number }} PathSegment
 */

/** @typedef {"jsonpath" | "js"} PathFormat */

// RFC 9535 member-name shorthand, and a JavaScript identifier.
const JSONPATH_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const JS_NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * The segments from the root to `id`. A chunk of a long string takes the
 * path of the string.
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {number} id
 * @returns {PathSegment[]}
 */
export function pathSegments(tree, id) {
  /** @type {PathSegment[]} */
  const segments = [];
  let node = id;
  if (tree.kinds[node] === CHUNK) node = tree.parents[node];
  for (; tree.parents[node] >= 0; node = tree.parents[node]) {
    const parent = tree.parents[node];
    const key = tree.keys[node];
    switch (tree.kinds[parent]) {
      case ARRAY:
        segments.push({ type: "index", index: /** @type {number} */ (key) });
        break;
      case OBJECT:
      case ERROR:
        segments.push({ type: "key", key: String(key) });
        break;
      case MAP:
        segments.push(
          typeof key === "object" || typeof key === "function"
            ? { type: "entry", index: tree.indexOf(node) }
            : { type: "get", key },
        );
        break;
      case SET:
        segments.push({ type: "item", index: /** @type {number} */ (key) });
        break;
    }
  }
  return segments.reverse();
}

/**
 * @param {unknown} key
 * @returns {string}
 */
function literal(key) {
  if (typeof key === "string") return JSON.stringify(key);
  if (typeof key === "bigint") return `${key}n`;
  return String(key);
}

/**
 * @param {string} text
 * @returns {string}
 */
function singleQuoted(text) {
  return `'${text.replace(/[\\']/g, "\\$&")}'`;
}

/**
 * @param {ReadonlyArray<PathSegment>} segments
 * @param {PathFormat} [format]
 * @param {string} [rootName] The identifier the `"js"` format starts from.
 * @returns {string}
 */
export function formatPath(segments, format = "jsonpath", rootName = "data") {
  if (format === "js") {
    let path = rootName;
    for (const segment of segments) {
      switch (segment.type) {
        case "key":
          path = JS_NAME.test(segment.key)
            ? `${path}.${segment.key}`
            : `${path}[${JSON.stringify(segment.key)}]`;
          break;
        case "index":
          path = `${path}[${segment.index}]`;
          break;
        case "get":
          path = `${path}.get(${literal(segment.key)})`;
          break;
        case "item":
          path = `[...${path}][${segment.index}]`;
          break;
        case "entry":
          path = `[...${path}.values()][${segment.index}]`;
          break;
      }
    }
    return path;
  }

  let path = "$";
  for (const segment of segments) {
    switch (segment.type) {
      case "key":
        path += JSONPATH_NAME.test(segment.key)
          ? `.${segment.key}`
          : `[${singleQuoted(segment.key)}]`;
        break;
      case "get":
        path +=
          typeof segment.key === "string"
            ? JSONPATH_NAME.test(segment.key)
              ? `.${segment.key}`
              : `[${singleQuoted(segment.key)}]`
            : `[${literal(segment.key)}]`;
        break;
      default:
        path += `[${segment.index}]`;
    }
  }
  return path;
}

/**
 * The node at `keys` below the root: a property name or an array index per
 * step. Creates the children along the way.
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {ReadonlyArray<string | number>} keys
 * @returns {number} The node, or -1 when the path does not exist.
 */
export function findByKeys(tree, keys) {
  let id = 0;
  for (const key of keys) {
    if (tree.kinds[id] <= LONG_STRING) return -1;
    const first = tree.materialize(id);
    const count = tree.childCount(id);
    const kind = tree.kinds[id];
    if (kind === ARRAY || kind === SET) {
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0 || index >= count) return -1;
      id = first + index;
      continue;
    }
    let found = -1;
    for (let i = 0; i < count; i++) {
      const childKey = tree.keys[first + i];
      if (childKey === key || String(childKey) === String(key)) {
        found = first + i;
        break;
      }
    }
    if (found < 0) return -1;
    id = found;
  }
  return id;
}
