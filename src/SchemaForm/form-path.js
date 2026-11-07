// @ts-check

/**
 * Field paths are dot-separated keys: `address.city`, `addresses.0.city`.
 * A key that holds a dot is not supported.
 */

const INDEX = /^\d+$/;

/**
 * @param {string} path
 * @returns {string[]}
 */
export function parsePath(path) {
  return path === "" ? [] : path.split(".");
}

/**
 * @param {string} parent
 * @param {string | number} key
 * @returns {string}
 */
export function joinPath(parent, key) {
  return parent === "" ? String(key) : `${parent}.${key}`;
}

/**
 * The path without its last key.
 * @param {string} path
 * @returns {string}
 */
export function parentPath(path) {
  const at = path.lastIndexOf(".");
  return at < 0 ? "" : path.slice(0, at);
}

/**
 * The last key of a path.
 * @param {string} path
 * @returns {string}
 */
export function lastKey(path) {
  return path.slice(path.lastIndexOf(".") + 1);
}

/**
 * Read a value by path.
 * @param {any} source
 * @param {string} path
 * @returns {any}
 */
export function getIn(source, path) {
  if (path === "") return source;
  let node = source;
  for (const key of parsePath(path)) {
    if (node == null) return undefined;
    node = node[key];
  }
  return node;
}

/**
 * Return a copy of `source` with the value at `path` replaced. Objects and
 * arrays along the path are copied; everything else is shared, so an
 * unchanged branch keeps its identity.
 * @param {any} source
 * @param {string} path
 * @param {unknown} value
 * @returns {any}
 */
export function setIn(source, path, value) {
  if (path === "") return value;
  const keys = parsePath(path);
  /**
   * @param {any} node
   * @param {number} depth
   * @returns {any}
   */
  const walk = (node, depth) => {
    if (depth === keys.length) return value;
    const key = keys[depth];
    const copy = Array.isArray(node)
      ? node.slice()
      : node && typeof node === "object"
        ? { ...node }
        : INDEX.test(key)
          ? []
          : {};
    copy[key] = walk(copy[key], depth + 1);
    return copy;
  };
  return walk(source, 0);
}

/**
 * The name a native form submits, `addresses[0].city`.
 * @param {string} path
 * @returns {string}
 */
export function pathToName(path) {
  return path.replace(/\.(\d+)(?=\.|$)/g, "[$1]");
}

/**
 * The inverse of `pathToName`.
 * @param {string} name
 * @returns {string}
 */
export function nameToPath(name) {
  return name.replace(/\[(\d+)\]/g, ".$1");
}

/**
 * A DOM id for a field, safe in `href="#id"` and `aria-describedby`.
 * @param {string} formId
 * @param {string} path
 * @returns {string}
 */
export function pathToId(formId, path) {
  return `${formId}-${path.replace(/\./g, "-")}`;
}

/**
 * The path with every array index replaced by `*`, the key a field's
 * configuration is stored under.
 * @param {string} path
 * @returns {string}
 */
export function templatePath(path) {
  return path.replace(/(^|\.)\d+(?=\.|$)/g, "$1*");
}

/**
 * Whether `path` is `prefix` or inside it.
 * @param {string} path
 * @param {string} prefix
 * @returns {boolean}
 */
export function isWithin(path, prefix) {
  return (
    prefix === "" ||
    path === prefix ||
    (path.length > prefix.length &&
      path.startsWith(prefix) &&
      path[prefix.length] === ".")
  );
}
