// Remote-object protocol, iframe side. Values never cross to the shell whole:
// a log sends a small preview plus a handle id, and the shell asks for one
// level of properties when the user expands a node. Getters aren't invoked
// until clicked.

const PREVIEW_ENTRIES = 5;
const CHUNK = 100;
const MAX_HANDLES = 50_000;
const MAX_STRING = 10_000;
const TYPED_ARRAY = Object.getPrototypeOf(Int8Array);

/**
 * @typedef {{ t: "string"; v: string; truncated?: boolean }
 *   | { t: "number" | "bigint" | "boolean" | "symbol"; v: string }
 *   | { t: "undefined" | "null" }
 *   | { t: "object"; id: number; sub: string; cls: string; desc: string; size?: number; source?: unknown }} Preview
 */

export function createRemote() {
  /** @type {Map<number, unknown>} */
  const handles = new Map();
  let nextId = 1;
  let temps = 0;

  function handle(value) {
    const id = nextId++;
    handles.set(id, value);
    if (handles.size > MAX_HANDLES) handles.delete(handles.keys().next().value);
    return id;
  }

  /** @returns {Preview} */
  function preview(value) {
    switch (typeof value) {
      case "string":
        return value.length > MAX_STRING
          ? { t: "string", v: value.slice(0, MAX_STRING), truncated: true }
          : { t: "string", v: value };
      case "number":
        return { t: "number", v: Object.is(value, -0) ? "-0" : String(value) };
      case "bigint":
        return { t: "bigint", v: `${value}n` };
      case "boolean":
        return { t: "boolean", v: String(value) };
      case "symbol":
        return { t: "symbol", v: value.toString() };
      case "undefined":
        return { t: "undefined" };
    }
    if (value === null) return { t: "null" };
    const sub = subtype(value);
    return {
      t: "object",
      id: handle(value),
      sub,
      cls: className(value, sub),
      desc: describe(value, sub, 1),
      size: sizeOf(value, sub),
    };
  }

  /**
   * One level of properties. Arrays and typed arrays longer than CHUNK
   * return range groups first (`[0 … 99]`), expanded with `range`.
   */
  function properties(id, range) {
    if (!handles.has(id)) return { gone: true, props: [] };
    const value = /** @type {any} */ (handles.get(id));
    const props = [];
    const sub = subtype(value);

    if (
      (sub === "array" || sub === "typedarray") &&
      !range &&
      value.length > CHUNK
    ) {
      for (let start = 0; start < value.length; start += CHUNK) {
        const end = Math.min(value.length, start + CHUNK) - 1;
        props.push({
          name: `[${start} … ${end}]`,
          group: true,
          id,
          range: [start, end],
        });
      }
      return { props };
    }
    if (range) {
      for (let i = range[0]; i <= range[1]; i++)
        props.push({ name: String(i), value: preview(value[i]) });
      return { props };
    }
    if (sub === "map") {
      let i = 0;
      for (const [k, v] of value) {
        props.push({ name: String(i++), entry: [preview(k), preview(v)] });
        if (i >= 1000) break;
      }
    } else if (sub === "set") {
      let i = 0;
      for (const v of value) {
        props.push({ name: String(i++), value: preview(v) });
        if (i >= 1000) break;
      }
    } else if (sub === "node" && value.childNodes) {
      for (const [i, child] of [...value.childNodes].slice(0, 500).entries()) {
        props.push({ name: String(i), value: preview(child), internal: true });
      }
    }

    for (const key of Reflect.ownKeys(value)) {
      if (sub === "node") break;
      const d = Object.getOwnPropertyDescriptor(value, key);
      if (!d) continue;
      const name = typeof key === "symbol" ? key.toString() : key;
      if (d.get || d.set) props.push({ name, getter: true, id, key: name });
      else
        props.push({ name, value: preview(d.value), enumerable: d.enumerable });
    }
    if (sub === "error") {
      props.push({
        name: "stack",
        value: preview(String(value.stack ?? "")),
        internal: true,
      });
    }
    const proto = Object.getPrototypeOf(value);
    if (
      proto &&
      proto !== Object.prototype &&
      proto !== Array.prototype &&
      sub !== "node"
    ) {
      props.push({
        name: "[[Prototype]]",
        value: preview(proto),
        internal: true,
      });
    }
    return { props };
  }

  function invokeGetter(id, key) {
    if (!handles.has(id)) return { gone: true };
    try {
      return { value: preview(/** @type {any} */ (handles.get(id))[key]) };
    } catch (error) {
      return { value: preview(error), threw: true };
    }
  }

  /** JSON for "Copy as JSON": cycles and non-JSON values are marked, depth capped. */
  function json(id) {
    if (!handles.has(id)) return { gone: true };
    const seen = new WeakSet();
    const replacer = (_key, v) => {
      if (typeof v === "bigint") return `${v}n`;
      if (typeof v === "function") return `[Function ${v.name || "anonymous"}]`;
      if (typeof v === "symbol") return v.toString();
      if (v instanceof Map) return Object.fromEntries(v);
      if (v instanceof Set) return [...v];
      if (typeof Node !== "undefined" && v instanceof Node)
        return `[${describe(v, "node", 0)}]`;
      if (v && typeof v === "object") {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    };
    try {
      return {
        text: JSON.stringify(handles.get(id), replacer, 2) ?? "undefined",
      };
    } catch (error) {
      return { error: String(error) };
    }
  }

  /** "Store as global variable": temp1, temp2, … */
  function storeGlobal(id, target = globalThis) {
    if (!handles.has(id)) return { gone: true };
    const name = `temp${++temps}`;
    target[name] = handles.get(id);
    return { name };
  }

  return {
    preview,
    properties,
    invokeGetter,
    json,
    storeGlobal,
    get: (id) => handles.get(id),
    has: (id) => handles.has(id),
    clear: () => handles.clear(),
  };
}

export function subtype(value) {
  if (typeof value === "function") return "function";
  if (Array.isArray(value)) return "array";
  if (value instanceof Map) return "map";
  if (value instanceof Set) return "set";
  if (value instanceof Date) return "date";
  if (value instanceof RegExp) return "regexp";
  if (value instanceof Error) return "error";
  if (value instanceof Promise) return "promise";
  if (value instanceof WeakMap || value instanceof WeakSet) return "weak";
  if (value instanceof TYPED_ARRAY) return "typedarray";
  if (typeof Node !== "undefined" && value instanceof Node) return "node";
  return "object";
}

function className(value, sub) {
  if (sub === "function") return "Function";
  if (sub === "node") return value.nodeName;
  try {
    const name = value.constructor?.name;
    if (typeof name === "string" && name) return name;
  } catch {}
  return "Object";
}

function sizeOf(value, sub) {
  if (sub === "array" || sub === "typedarray") return value.length;
  if (sub === "map" || sub === "set") return value.size;
  return undefined;
}

/** One-line description, like a devtools collapsed row. */
export function describe(value, sub = subtype(value), depth = 0) {
  switch (sub) {
    case "function":
      return `ƒ ${value.name || "anonymous"}()`;
    case "date":
      return Number.isNaN(value.getTime())
        ? "Invalid Date"
        : value.toISOString();
    case "regexp":
      return String(value);
    case "error":
      return `${value.name}: ${value.message}`;
    case "promise":
      return "Promise";
    case "weak":
      return className(value, sub);
    case "node":
      return nodeLabel(value);
  }
  if (depth <= 0) {
    if (sub === "array") return `Array(${value.length})`;
    if (sub === "map" || sub === "set")
      return `${className(value, sub)}(${value.size})`;
    if (sub === "typedarray")
      return `${className(value, sub)}(${value.length})`;
    const cls = className(value, sub);
    return cls === "Object" ? "{…}" : cls;
  }
  const inner = (v) =>
    (v !== null && typeof v === "object") || typeof v === "function"
      ? describe(v, subtype(v), depth - 1)
      : primitive(v);
  if (sub === "array" || sub === "typedarray") {
    const items = [
      ...Array.prototype.slice.call(value, 0, PREVIEW_ENTRIES),
    ].map(inner);
    if (value.length > PREVIEW_ENTRIES) items.push("…");
    return `${sub === "array" ? "" : `${className(value, sub)}`}(${value.length}) [${items.join(", ")}]`;
  }
  if (sub === "map") {
    const items = [...value]
      .slice(0, PREVIEW_ENTRIES)
      .map(([k, v]) => `${inner(k)} => ${inner(v)}`);
    if (value.size > PREVIEW_ENTRIES) items.push("…");
    return `Map(${value.size}) {${items.join(", ")}}`;
  }
  if (sub === "set") {
    const items = [...value].slice(0, PREVIEW_ENTRIES).map(inner);
    if (value.size > PREVIEW_ENTRIES) items.push("…");
    return `Set(${value.size}) {${items.join(", ")}}`;
  }
  const keys = Object.keys(value);
  const items = [];
  for (const k of keys.slice(0, PREVIEW_ENTRIES)) {
    const d = Object.getOwnPropertyDescriptor(value, k);
    items.push(`${k}: ${d && "value" in d ? inner(d.value) : "(…)"}`);
  }
  if (keys.length > PREVIEW_ENTRIES) items.push("…");
  const cls = className(value, sub);
  return `${cls === "Object" ? "" : `${cls} `}{${items.join(", ")}}`;
}

function primitive(v) {
  if (typeof v === "string")
    return JSON.stringify(v.length > 40 ? `${v.slice(0, 40)}…` : v);
  if (typeof v === "bigint") return `${v}n`;
  if (typeof v === "symbol") return v.toString();
  if (Object.is(v, -0)) return "-0";
  return String(v);
}

function nodeLabel(node) {
  if (node.nodeType === 3)
    return `#text ${JSON.stringify(node.data.slice(0, 40))}`;
  if (node.nodeType === 8) return "<!---->";
  if (node.nodeType === 9) return "#document";
  if (node.nodeType !== 1) return node.nodeName;
  const tag = node.tagName.toLowerCase();
  const id = node.id ? `#${node.id}` : "";
  const cls = node.classList.length
    ? `.${[...node.classList].slice(0, 3).join(".")}`
    : "";
  return `<${tag}${id}${cls}>`;
}
