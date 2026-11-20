// @ts-check
// The data model behind `JsonViewer`: any JavaScript value as a lazily
// materialized tree, stored as parallel columns instead of one object per node.
//
// A node is an integer id. `kinds`, `keys`, `values`, `parents`, `depths`,
// `firsts` and `sizes` hold its fields, so a million nodes cost about 50 MB of
// plain arrays and no per-node allocation. A container's children are created
// the first time something reads them (`materialize`), and are contiguous, so
// a child's position among its siblings is `id - firsts[parent]`.

/** @typedef {number} NodeId */

export const NULL = 0;
export const UNDEFINED = 1;
export const BOOLEAN = 2;
export const NUMBER = 3;
export const BIGINT = 4;
export const STRING = 5;
export const SYMBOL = 6;
export const FUNCTION = 7;
export const DATE = 8;
export const REGEXP = 9;
/** A value the viewer cannot look inside: a `Promise`, `WeakMap`, and so on. */
export const OPAQUE = 10;
/** A reference to one of its own ancestors. `firsts` holds that ancestor. */
export const CIRCULAR = 11;
/** One piece of a long string, shown when the string is expanded. */
export const CHUNK = 12;
/** A property whose getter threw. `values` holds the thrown value. */
export const THROWS = 13;

// Kinds from here on can have children.
export const LONG_STRING = 14;
export const OBJECT = 15;
export const ARRAY = 16;
export const MAP = 17;
export const SET = 18;
export const ERROR = 19;

/** @type {ReadonlyArray<string>} */
export const KIND_NAMES = [
  "null",
  "undefined",
  "boolean",
  "number",
  "bigint",
  "string",
  "symbol",
  "function",
  "date",
  "regexp",
  "opaque",
  "circular",
  "string",
  "error",
  "string",
  "object",
  "array",
  "map",
  "set",
  "error",
];

export const FLAG_EXPANDED = 1;
/** Expanded by a search, not by the user, so clearing the search can undo it. */
export const FLAG_AUTO = 2;
export const FLAG_MATCH_KEY = 4;
export const FLAG_MATCH_VALUE = 8;

/** Default for the longest string shown before it is truncated. */
export const DEFAULT_MAX_STRING_LENGTH = 100;

const ERROR_PROPS = ["name", "message", "stack"];

/**
 * @param {unknown} value
 * @param {number} maxStringLength
 * @returns {number}
 */
function classify(value, maxStringLength) {
  switch (typeof value) {
    case "string":
      return value.length > maxStringLength ? LONG_STRING : STRING;
    case "number":
      return NUMBER;
    case "boolean":
      return BOOLEAN;
    case "undefined":
      return UNDEFINED;
    case "bigint":
      return BIGINT;
    case "symbol":
      return SYMBOL;
    case "function":
      return FUNCTION;
  }
  if (value === null) return NULL;
  if (Array.isArray(value)) return ARRAY;
  if (value instanceof Date) return DATE;
  if (value instanceof Map) return MAP;
  if (value instanceof Set) return SET;
  if (value instanceof RegExp) return REGEXP;
  if (value instanceof Error) return ERROR;
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) return ARRAY;
  if (
    value instanceof Promise ||
    value instanceof WeakMap ||
    value instanceof WeakSet
  ) {
    return OPAQUE;
  }
  return OBJECT;
}

/**
 * The own property names an error shows: `name`, `message` and `stack`, which
 * are not enumerable, then its enumerable own properties.
 * @param {Error} error
 * @returns {string[]}
 */
function errorKeys(error) {
  const keys = ERROR_PROPS.filter(
    (key) => typeof (/** @type {any} */ (error)[key]) === "string",
  );
  for (const key of Object.keys(error)) {
    if (!ERROR_PROPS.includes(key)) keys.push(key);
  }
  if ("cause" in error && !keys.includes("cause")) keys.push("cause");
  return keys;
}

export class JsonTree {
  /**
   * @param {unknown} root
   * @param {{ maxStringLength?: number }} [options]
   */
  constructor(root, options = {}) {
    /** Longest string shown before it truncates, and the size of one chunk. */
    this.maxStringLength = Math.max(
      1,
      options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH,
    );
    /** @type {number[]} */
    this.kinds = [];
    /** @type {unknown[]} */
    this.keys = [];
    /** @type {unknown[]} */
    this.values = [];
    /** @type {number[]} */
    this.parents = [];
    /** @type {number[]} */
    this.depths = [];
    /** @type {number[]} */
    this.firsts = [];
    /** @type {number[]} */
    this.sizes = [];
    /** @type {Uint8Array} */
    this.flags = new Uint8Array(256);
    /** How many nodes exist so far. */
    this.length = 0;
    this.add(-1, undefined, root, 0, classify(root, this.maxStringLength));
  }

  /**
   * @param {NodeId} parent
   * @param {unknown} key
   * @param {unknown} value
   * @param {number} depth
   * @param {number} kind
   * @returns {NodeId}
   */
  add(parent, key, value, depth, kind) {
    const id = this.length++;
    this.kinds.push(kind);
    this.keys.push(key);
    this.values.push(value);
    this.parents.push(parent);
    this.depths.push(depth);
    this.firsts.push(-1);
    this.sizes.push(kind >= LONG_STRING ? -1 : 0);
    if (id >= this.flags.length) {
      const grown = new Uint8Array(this.flags.length * 2);
      grown.set(this.flags);
      this.flags = grown;
    }
    return id;
  }

  /**
   * Whether `id` has children, even before they are created.
   * @param {NodeId} id
   * @returns {boolean}
   */
  canExpand(id) {
    return this.kinds[id] >= LONG_STRING && this.childCount(id) > 0;
  }

  /**
   * How many children `id` has. Reads the value, not the node table, so a
   * collapsed container is counted without creating its children.
   * @param {NodeId} id
   * @returns {number}
   */
  childCount(id) {
    const cached = this.sizes[id];
    if (cached >= 0) return cached;
    const value = /** @type {any} */ (this.values[id]);
    /** @type {number} */
    let count = 0;
    switch (this.kinds[id]) {
      case LONG_STRING:
        count = Math.ceil(value.length / this.maxStringLength);
        break;
      case ARRAY:
        count = value.length;
        break;
      case OBJECT:
        count = Object.keys(value).length;
        break;
      case MAP:
      case SET:
        count = value.size;
        break;
      case ERROR:
        count = errorKeys(value).length;
        break;
    }
    this.sizes[id] = count;
    return count;
  }

  /**
   * Create the children of `id`, once. Returns the id of the first child.
   * @param {NodeId} id
   * @returns {NodeId}
   */
  materialize(id) {
    if (this.firsts[id] >= 0) return this.firsts[id];
    const kind = this.kinds[id];
    if (kind < LONG_STRING) return -1;

    const value = /** @type {any} */ (this.values[id]);
    const depth = this.depths[id] + 1;
    const first = this.length;
    this.firsts[id] = first;

    if (kind === LONG_STRING) {
      const count = this.childCount(id);
      for (let i = 0; i < count; i++) this.add(id, i, undefined, depth, CHUNK);
      return first;
    }

    // A child that is one of its ancestors would expand forever. Look up
    // ancestors once per parent, not once per child.
    /** @type {Set<unknown>} */
    const ancestors = new Set();
    for (let p = id; p >= 0; p = this.parents[p]) {
      const v = this.values[p];
      if (typeof v === "object" && v !== null) ancestors.add(v);
    }

    /**
     * @param {unknown} key
     * @param {unknown} child
     */
    const addChild = (key, child) => {
      if (typeof child === "object" && child !== null && ancestors.has(child)) {
        const circular = this.add(id, key, child, depth, CIRCULAR);
        this.firsts[circular] = this.ancestorWithValue(id, child);
        return;
      }
      this.add(id, key, child, depth, classify(child, this.maxStringLength));
    };

    /**
     * Reading a property can run a getter, which can throw.
     * @param {unknown} key
     * @param {() => unknown} read
     */
    const addRead = (key, read) => {
      try {
        addChild(key, read());
      } catch (error) {
        this.add(id, key, error, depth, THROWS);
      }
    };

    switch (kind) {
      case ARRAY: {
        const length = value.length;
        for (let i = 0; i < length; i++) addChild(i, value[i]);
        break;
      }
      case OBJECT: {
        for (const key of Object.keys(value)) addRead(key, () => value[key]);
        break;
      }
      case MAP: {
        for (const [key, entry] of value) addChild(key, entry);
        break;
      }
      case SET: {
        let i = 0;
        for (const entry of value) addChild(i++, entry);
        break;
      }
      case ERROR: {
        for (const key of errorKeys(value)) addRead(key, () => value[key]);
        break;
      }
    }
    return first;
  }

  /**
   * The nearest ancestor of `from`, or `from`, whose value is `value`.
   * @param {NodeId} from
   * @param {unknown} value
   * @returns {NodeId}
   */
  ancestorWithValue(from, value) {
    for (let p = from; p >= 0; p = this.parents[p]) {
      if (this.values[p] === value) return p;
    }
    return 0;
  }

  /**
   * @param {NodeId} id
   * @returns {boolean}
   */
  isExpanded(id) {
    return (this.flags[id] & FLAG_EXPANDED) !== 0;
  }

  /**
   * Expand or collapse `id`, creating its children when it expands. A user
   * toggle clears the search's claim on the node.
   * @param {NodeId} id
   * @param {boolean} expanded
   * @param {boolean} [auto] Set by a search.
   */
  setExpanded(id, expanded, auto = false) {
    if (expanded) {
      if (!this.canExpand(id)) return;
      this.materialize(id);
      this.flags[id] |= auto ? FLAG_EXPANDED | FLAG_AUTO : FLAG_EXPANDED;
      if (!auto) this.flags[id] &= ~FLAG_AUTO;
    } else {
      this.flags[id] &= ~(FLAG_EXPANDED | FLAG_AUTO);
    }
  }

  /**
   * The id of a child of `id`, by position.
   * @param {NodeId} id
   * @param {number} index
   * @returns {NodeId}
   */
  childAt(id, index) {
    return this.materialize(id) + index;
  }

  /**
   * Position among siblings, from 0.
   * @param {NodeId} id
   * @returns {number}
   */
  indexOf(id) {
    const parent = this.parents[id];
    return parent < 0 ? 0 : id - this.firsts[parent];
  }

  /**
   * How many siblings `id` has, itself included.
   * @param {NodeId} id
   * @returns {number}
   */
  siblingCount(id) {
    const parent = this.parents[id];
    return parent < 0 ? 1 : this.childCount(parent);
  }

  /**
   * The text of a chunk of a long string.
   * @param {NodeId} id
   * @returns {string}
   */
  chunkText(id) {
    const text = /** @type {string} */ (this.values[this.parents[id]]);
    const start = this.indexOf(id) * this.maxStringLength;
    return text.slice(start, start + this.maxStringLength);
  }

  /**
   * Ancestors of `id`, nearest first.
   * @param {NodeId} id
   * @returns {NodeId[]}
   */
  ancestors(id) {
    /** @type {NodeId[]} */
    const list = [];
    for (let p = this.parents[id]; p >= 0; p = this.parents[p]) list.push(p);
    return list;
  }
}
