// @ts-check
// Resolve what a property inspector shows for a selection of objects, and
// record the edits made to them.

import { deepEqual } from "../utils/deep-equal.js";

/**
 * @typedef {object} ResolvableProperty
 * @property {string} id
 * @property {unknown} [default] - The value that counts as unmodified.
 * @property {(target: any) => boolean} [appliesTo] - Whether an object has the property.
 * @property {boolean | ((target: any) => boolean)} [readOnly] - A fixed or per-object read-only flag.
 */

/**
 * @typedef {object} ResolveOptions
 * @property {(target: any, id: string) => unknown} getValue - Read one object's value.
 * @property {(target: any, id: string) => unknown} [getDefault] - A per-object default, which wins over the property's.
 * @property {(a: unknown, b: unknown) => boolean} [equals] - Compare two values. Defaults to deep equality.
 * @property {"all" | "any"} [scope] - Show a property when every selected object has it (`"all"`, the default) or when any does.
 */

/**
 * What the inspector shows for one property.
 * @typedef {object} PropertyState
 * @property {string} id
 * @property {boolean} applicable - Whether the property is shown for this selection.
 * @property {number} count - The number of selected objects that have the property.
 * @property {boolean} mixed - Whether the objects hold different values.
 * @property {unknown} value - The shared value, or `undefined` when mixed.
 * @property {boolean} modified - Whether any object differs from its default.
 * @property {boolean} readOnly - Whether every object that has the property is read-only.
 * @property {number} readOnlyCount - How many are read-only.
 */

/**
 * One value that changed on one object.
 * @typedef {object} Change
 * @property {any} target - The object.
 * @property {unknown} targetId - Its id.
 * @property {string} property
 * @property {unknown} oldValue - The value before the gesture began.
 * @property {unknown} newValue
 */

/**
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function defaultEquals(a, b) {
  if (a === b || Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  return deepEqual(a, b);
}

/**
 * The objects a property applies to.
 * @param {ReadonlyArray<any>} selection
 * @param {ResolvableProperty} property
 * @returns {ReadonlyArray<any>}
 */
export function targetsOf(selection, property) {
  return property.appliesTo
    ? selection.filter((target) =>
        /** @type {Function} */ (property.appliesTo)(target),
      )
    : selection;
}

/**
 * @param {ResolvableProperty} property
 * @param {any} target
 * @returns {boolean}
 */
function isReadOnly(property, target) {
  const { readOnly } = property;
  return typeof readOnly === "function" ? readOnly(target) : !!readOnly;
}

/**
 * The objects an edit reaches: those that have the property and are not
 * read-only.
 * @param {ReadonlyArray<any>} selection
 * @param {ResolvableProperty} property
 * @returns {ReadonlyArray<any>}
 */
export function editableTargets(selection, property) {
  const targets = targetsOf(selection, property);
  if (!property.readOnly) return targets;
  return targets.filter((target) => !isReadOnly(property, target));
}

/**
 * Compare a list of values for one property.
 * It stops reading at the first value that differs, unless the property
 * needs a per-object default.
 *
 * @param {ReadonlyArray<any>} selection
 * @param {ResolvableProperty} property
 * @param {ResolveOptions} options
 * @returns {PropertyState}
 */
export function resolveProperty(selection, property, options) {
  const { getValue, getDefault, scope = "all" } = options;
  const equals = options.equals ?? defaultEquals;
  const targets = targetsOf(selection, property);
  const count = targets.length;
  const applicable =
    count > 0 && (scope === "any" || count === selection.length);

  /** @type {PropertyState} */
  const state = {
    id: property.id,
    applicable,
    count,
    mixed: false,
    value: undefined,
    modified: false,
    readOnly: false,
    readOnlyCount: 0,
  };
  if (!applicable) return state;

  const { id } = property;
  const first = getValue(targets[0], id);
  let mixed = false;
  let modified = false;

  if (getDefault) {
    for (let index = 0; index < count; index++) {
      const target = targets[index];
      const value = index === 0 ? first : getValue(target, id);
      if (!mixed && index > 0 && !equals(first, value)) mixed = true;
      if (!modified && !equals(value, getDefault(target, id))) modified = true;
      if (mixed && modified) break;
    }
  } else {
    for (let index = 1; index < count; index++) {
      if (!equals(first, getValue(targets[index], id))) {
        mixed = true;
        break;
      }
    }
    // Different values cannot all equal one default. A property with no
    // default has nothing to reset to, so it is never modified.
    modified =
      property.default !== undefined &&
      (mixed || !equals(first, property.default));
  }

  let readOnlyCount = 0;
  if (property.readOnly) {
    for (let index = 0; index < count; index++) {
      if (isReadOnly(property, targets[index])) readOnlyCount++;
    }
  }

  state.mixed = mixed;
  state.value = mixed ? undefined : first;
  state.modified = modified;
  state.readOnlyCount = readOnlyCount;
  state.readOnly = readOnlyCount === count;
  return state;
}

/**
 * @param {PropertyState} a
 * @param {PropertyState} b
 * @param {(a: unknown, b: unknown) => boolean} equals
 * @returns {boolean}
 */
function sameState(a, b, equals) {
  return (
    a.applicable === b.applicable &&
    a.count === b.count &&
    a.mixed === b.mixed &&
    a.modified === b.modified &&
    a.readOnly === b.readOnly &&
    a.readOnlyCount === b.readOnlyCount &&
    equals(a.value, b.value)
  );
}

/**
 * Resolve every property. A state equal to the one in `previous` is reused,
 * so a row whose state did not change gets the same object back and does no
 * work when the selection changes.
 *
 * @param {ReadonlyArray<any>} selection
 * @param {ReadonlyArray<ResolvableProperty>} properties
 * @param {ResolveOptions} options
 * @param {ReadonlyMap<string, PropertyState>} [previous]
 * @returns {Map<string, PropertyState>}
 */
export function resolveProperties(selection, properties, options, previous) {
  const equals = options.equals ?? defaultEquals;
  /** @type {Map<string, PropertyState>} */
  const states = new Map();
  for (const property of properties) {
    const next = resolveProperty(selection, property, options);
    const before = previous?.get(property.id);
    states.set(
      property.id,
      before && sameState(before, next, equals) ? before : next,
    );
  }
  return states;
}

/**
 * One undoable edit: a set of values read when it began, and the new values
 * written as it goes on. A scrub drag calls `update` for every pointer
 * move; the `Change[]` from `commit` describes the whole drag, so a history
 * records one step for it.
 *
 * @param {ReadonlyArray<{ target: any; targetId: unknown; property: string; from: unknown }>} entries
 */
export function createGesture(entries) {
  /** @type {unknown[]} */
  let latest = entries.map((entry) => entry.from);
  let started = false;

  /**
   * @param {number} index
   * @param {unknown} newValue
   * @returns {Change}
   */
  function toChange(index, newValue) {
    const entry = entries[index];
    return {
      target: entry.target,
      targetId: entry.targetId,
      property: entry.property,
      oldValue: entry.from,
      newValue,
    };
  }

  return {
    /**
     * Compute every entry's new value. Returns every entry with its latest
     * value, including those back where they began, so a consumer that
     * applied an earlier update can take it back; or `null` when nothing
     * moved since the last update.
     *
     * @param {(entry: (typeof entries)[number]) => unknown} valueFor
     * @returns {Change[] | null}
     */
    update(valueFor) {
      const next = entries.map((entry) => valueFor(entry));
      const moved = next.some(
        (value, index) => !defaultEquals(value, latest[index]),
      );
      latest = next;
      if (!moved && started) return null;
      started = true;
      return next.map((value, index) => toChange(index, value));
    },

    /**
     * The entries whose value differs from where the gesture began.
     * @returns {Change[]}
     */
    changes() {
      /** @type {Change[]} */
      const result = [];
      for (let index = 0; index < entries.length; index++) {
        if (!defaultEquals(entries[index].from, latest[index])) {
          result.push(toChange(index, latest[index]));
        }
      }
      return result;
    },
  };
}
