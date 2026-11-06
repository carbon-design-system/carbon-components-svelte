// @ts-check
// One selection model: single and multiple selection over an ordered list of
// keys, as a file browser, a table and a listbox do it. Click selects, Cmd or
// Ctrl toggles, Shift selects the range from the anchor, Space and the arrow
// keys do the same from the keyboard. A selection is a set of keys, never DOM
// nodes or indexes, so it survives a sort, a filter and a virtualized window.
//
// The functions are pure: state in, state out, the same state back when
// nothing changed. `createSelection` wraps them in a store for a component.

import { isApplePlatform } from "./keyboard-shortcut.js";
import { rangeSlice } from "./range-slice.js";
import {
  resolveCheckboxState,
  toggleCheckboxNode,
} from "./tree-checkbox-state.js";

/**
 * @typedef {string | number} SelectionKey
 */

/**
 * @template {SelectionKey} [Key=SelectionKey]
 * @typedef {Object} SelectionState
 * @property {ReadonlySet<Key>} selected - Selected keys, in the order they were added.
 * @property {Key | null} anchor - Where a Shift range starts.
 * @property {Key | null} focus - The key the cursor is on. Moving it never changes `selected`.
 * @property {ReadonlySet<Key>} indeterminate - Tree only: parents with some, not all, descendants selected.
 */

/**
 * @template {SelectionKey} [Key=SelectionKey]
 * @typedef {Object} SelectionContext
 * @property {ReadonlyArray<Key>} order - Every key in the order it is shown. Ranges and arrow keys walk it. Treat it as immutable: pass a new array when the order changes.
 * @property {"single" | "multiple"} [mode="multiple"]
 * @property {(key: Key) => boolean} [isDisabled] - A disabled key is never selected by a range, select all, or an arrow step.
 * @property {"keep" | "move"} [anchorOnRange="keep"] - Where the anchor goes after a Shift range. `"keep"` (Finder, Explorer, TreeView) holds it, so the opposite direction shrinks the range. `"move"` (a checkbox column, Gmail) sets it to the clicked key, so ranges chain.
 * @property {(from: Key, to: Key, order: ReadonlyArray<Key>) => Key[] | null} [range] - Replace the linear range, for a grid that selects a rectangle. Return `null` for no range.
 * @property {boolean} [allowDeselect=false] - Single mode: toggling the selected key clears it.
 * @property {{ nodes: ReadonlyArray<TreeSelectionNode<Key>>, cascade?: boolean }} [tree] - Selecting a parent selects its descendants and a parent is indeterminate when some are.
 */

/**
 * @template {SelectionKey} [Key=SelectionKey]
 * @typedef {Object} TreeSelectionNode
 * @property {Key} id
 * @property {boolean} [disabled]
 * @property {ReadonlyArray<TreeSelectionNode<Key>>} [nodes]
 */

/**
 * @typedef {"none" | "some" | "all"} SelectionLevel
 */

/**
 * @typedef {Object} SelectionSummary
 * @property {SelectionLevel} state - For a header checkbox: nothing, some or every selectable key in scope.
 * @property {boolean} checked - `state === "all"`.
 * @property {boolean} indeterminate - `state === "some"`.
 * @property {number} count - Selected keys in scope.
 * @property {number} total - Selectable keys in scope.
 * @property {number} size - Every selected key, in scope or not.
 * @property {number} hidden - Selected keys outside the scope: filtered out, or on another page.
 */

/**
 * @typedef {Object} SelectionModifiers
 * @property {boolean} [shift]
 * @property {boolean} [toggle] - Cmd or Ctrl.
 */

const EMPTY_SET = /** @type {ReadonlySet<any>} */ (new Set());

const INDEX_CACHE_MIN = 32;
/** @type {WeakMap<ReadonlyArray<any>, { length: number, map: Map<any, number> }>} */
const indexCache = new WeakMap();

/**
 * Position of `key` in `order`. Lists of 32 or more build a lookup map once
 * per array, so a Shift-click or an arrow key on 10,000 rows does not scan.
 * @template {SelectionKey} Key
 * @param {ReadonlyArray<Key>} order
 * @param {Key | null | undefined} key
 * @returns {number}
 */
export function indexOfKey(order, key) {
  if (key === null || key === undefined) return -1;
  if (order.length < INDEX_CACHE_MIN) return order.indexOf(key);
  let entry = indexCache.get(order);
  if (!entry || entry.length !== order.length) {
    const map = new Map();
    for (let index = 0; index < order.length; index++) {
      if (!map.has(order[index])) map.set(order[index], index);
    }
    entry = { length: order.length, map };
    indexCache.set(order, entry);
  }
  const index = entry.map.get(key);
  return index === undefined ? -1 : index;
}

/**
 * @template {SelectionKey} [Key=SelectionKey]
 * @param {Iterable<Key>} [selected]
 * @param {Key | null} [anchor]
 * @param {Key | null} [focus]
 * @returns {SelectionState<Key>}
 */
export function createSelectionState(
  selected = [],
  anchor = null,
  focus = null,
) {
  return {
    selected: new Set(selected),
    anchor,
    focus,
    indeterminate: EMPTY_SET,
  };
}

/**
 * @template {SelectionKey} Key
 * @param {ReadonlySet<Key>} a
 * @param {ReadonlySet<Key>} b
 */
function sameSet(a, b) {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const key of a) if (!b.has(key)) return false;
  return true;
}

/**
 * Seed ids to a resolved tree state, or pass a flat state through.
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} prev
 * @param {SelectionState<Key>} next
 * @param {SelectionContext<Key>} ctx
 * @returns {SelectionState<Key>}
 */
function commit(prev, next, ctx) {
  let state = next;
  if (ctx.tree) {
    const resolved = resolveCheckboxState(
      /** @type {any} */ (ctx.tree.nodes),
      [...next.selected],
      { cascade: ctx.tree.cascade !== false },
    );
    state = {
      ...next,
      selected: new Set(/** @type {Key[]} */ (resolved.checkedIds)),
      indeterminate: new Set(/** @type {Key[]} */ (resolved.indeterminateIds)),
    };
  }
  if (
    prev.anchor === state.anchor &&
    prev.focus === state.focus &&
    sameSet(prev.selected, state.selected) &&
    sameSet(prev.indeterminate, state.indeterminate)
  ) {
    return prev;
  }
  return state;
}

/**
 * @template {SelectionKey} Key
 * @param {SelectionContext<Key>} ctx
 * @param {Key} key
 */
function disabled(ctx, key) {
  return ctx.isDisabled ? ctx.isDisabled(key) : false;
}

/**
 * Move the cursor. The selection does not change.
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @param {Key | null} key
 * @returns {SelectionState<Key>}
 */
export function moveFocus(state, key) {
  return state.focus === key ? state : { ...state, focus: key };
}

/**
 * Select `key` alone. In a tree, its descendants come with it.
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @param {Key} key
 * @param {SelectionContext<Key>} ctx
 * @returns {SelectionState<Key>}
 */
export function selectKey(state, key, ctx) {
  if (disabled(ctx, key)) return state;
  return commit(
    state,
    { ...state, selected: new Set([key]), anchor: key, focus: key },
    ctx,
  );
}

/**
 * Flip `key`. In single mode, selecting it replaces the selection, and
 * flipping the selected key clears it only with `allowDeselect`.
 * In a tree, a parent takes its descendants with it, and a clicked
 * indeterminate parent becomes fully selected.
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @param {Key} key
 * @param {SelectionContext<Key>} ctx
 * @param {boolean} [force] - Select (`true`) or deselect (`false`) rather than flip.
 * @returns {SelectionState<Key>}
 */
export function toggleKey(state, key, ctx, force) {
  if (disabled(ctx, key)) return state;
  const has = state.selected.has(key);
  const selecting = force ?? !has;

  if (ctx.mode === "single") {
    if (selecting) return selectKey(state, key, ctx);
    if (!has || ctx.allowDeselect !== true) return moveFocus(state, key);
    return commit(
      state,
      { ...state, selected: new Set(), anchor: key, focus: key },
      ctx,
    );
  }

  if (ctx.tree) {
    const seeds = toggleCheckboxNode(
      /** @type {any} */ (ctx.tree.nodes),
      [...state.selected],
      key,
      selecting,
      { cascade: ctx.tree.cascade !== false },
    );
    return commit(
      state,
      {
        ...state,
        selected: new Set(/** @type {Key[]} */ (seeds)),
        anchor: key,
        focus: key,
      },
      ctx,
    );
  }

  const selected = new Set(state.selected);
  if (selecting) selected.add(key);
  else selected.delete(key);
  return commit(state, { ...state, selected, anchor: key, focus: key }, ctx);
}

/**
 * The keys a range from `anchor` to `key` covers, minus disabled ones, or
 * `null` when the anchor is not in the order.
 * @template {SelectionKey} Key
 * @param {Key | null} anchor
 * @param {Key} key
 * @param {SelectionContext<Key>} ctx
 * @returns {Key[] | null}
 */
export function rangeKeys(anchor, key, ctx) {
  if (anchor === null) return null;
  const { order } = ctx;
  if (indexOfKey(order, anchor) === -1 || indexOfKey(order, key) === -1) {
    return null;
  }
  const keys = ctx.range
    ? ctx.range(anchor, key, order)
    : rangeSlice(order, indexOfKey(order, anchor), indexOfKey(order, key));
  if (keys === null) return null;
  return ctx.isDisabled ? keys.filter((item) => !disabled(ctx, item)) : keys;
}

/**
 * Select the range from the anchor to `key`, over the current order.
 *
 * - `"replace"`: the selection becomes the range (a file browser).
 * - `"add"`: the range joins the selection (Cmd+Shift, or a checked box).
 * - `"remove"`: the range leaves the selection (an unchecked box).
 *
 * With no anchor in the order, `key` alone is replaced, added or removed.
 * Single mode selects `key`.
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @param {Key} key
 * @param {SelectionContext<Key>} ctx
 * @param {"replace" | "add" | "remove"} [how]
 * @returns {SelectionState<Key>}
 */
export function extendTo(state, key, ctx, how = "replace") {
  if (ctx.mode === "single") return selectKey(state, key, ctx);
  if (disabled(ctx, key)) return state;

  const keys = rangeKeys(state.anchor, key, ctx);
  if (keys === null) {
    if (how === "replace") return selectKey(state, key, ctx);
    return toggleKey(state, key, ctx, how === "add");
  }

  /** @type {Set<Key>} */
  let selected;
  if (how === "replace") selected = new Set(keys);
  else {
    selected = new Set(state.selected);
    for (const item of keys) {
      if (how === "add") selected.add(item);
      else selected.delete(item);
    }
  }
  const anchor = ctx.anchorOnRange === "move" ? key : state.anchor;
  return commit(state, { ...state, selected, anchor, focus: key }, ctx);
}

/**
 * Add every selectable key of `scope` (default: the order).
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @param {SelectionContext<Key>} ctx
 * @param {ReadonlyArray<Key>} [scope]
 * @returns {SelectionState<Key>}
 */
export function selectAll(state, ctx, scope = ctx.order) {
  if (ctx.mode === "single") return state;
  const selected = new Set(state.selected);
  for (const key of scope) if (!disabled(ctx, key)) selected.add(key);
  return commit(
    state,
    { ...state, selected, anchor: state.anchor ?? scope[0] ?? null },
    ctx,
  );
}

/**
 * Remove the keys of `scope` and keep the rest, such as rows a filter hides.
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @param {SelectionContext<Key>} ctx
 * @param {ReadonlyArray<Key>} [scope]
 * @returns {SelectionState<Key>}
 */
export function deselectScope(state, ctx, scope = ctx.order) {
  if (state.selected.size === 0) return state;
  const selected = new Set(state.selected);
  for (const key of scope) selected.delete(key);
  return commit(state, { ...state, selected }, ctx);
}

/**
 * Empty the selection. The cursor stays.
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @returns {SelectionState<Key>}
 */
export function clearSelection(state) {
  if (state.selected.size === 0 && state.anchor === null) return state;
  return {
    ...state,
    selected: EMPTY_SET,
    anchor: null,
    indeterminate: EMPTY_SET,
  };
}

/**
 * What a header checkbox shows and does for `scope`.
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @param {ReadonlyArray<Key>} scope
 * @param {(key: Key) => boolean} [isDisabled]
 * @returns {SelectionSummary}
 */
export function summarizeSelection(state, scope, isDisabled) {
  let total = 0;
  let count = 0;
  for (const key of scope) {
    if (isDisabled?.(key)) continue;
    total++;
    if (state.selected.has(key)) count++;
  }
  const level = count === 0 ? "none" : count === total ? "all" : "some";
  return {
    state: level,
    checked: level === "all",
    indeterminate: level === "some",
    count,
    total,
    size: state.selected.size,
    hidden: state.selected.size - count,
  };
}

/**
 * The header checkbox: none selects all, all clears the scope, and `some`
 * does what `partial` says. DataTable clears (`"clear"`); MultiSelect
 * selects the rest (`"all"`).
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @param {SelectionContext<Key>} ctx
 * @param {ReadonlyArray<Key>} [scope]
 * @param {"clear" | "all"} [partial]
 * @returns {SelectionState<Key>}
 */
export function toggleAll(state, ctx, scope = ctx.order, partial = "clear") {
  const { state: level } = summarizeSelection(state, scope, ctx.isDisabled);
  if (level === "all" || (level === "some" && partial === "clear")) {
    return deselectScope(state, ctx, scope);
  }
  return selectAll(state, ctx, scope);
}

/**
 * A key's level in a tree: `"all"` selected, `"some"` indeterminate.
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @param {Key} key
 * @returns {SelectionLevel}
 */
export function keyLevel(state, key) {
  if (state.selected.has(key)) return "all";
  return state.indeterminate.has(key) ? "some" : "none";
}

/**
 * Drop selected keys that `present` no longer has: after a delete, a move,
 * or, with `hidden: "drop"`, a filter.
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @param {{ has(key: Key): boolean }} present
 * @returns {SelectionState<Key>}
 */
export function pruneSelection(state, present) {
  let dropped = false;
  /** @type {Key[]} */
  const kept = [];
  for (const key of state.selected) {
    if (present.has(key)) kept.push(key);
    else dropped = true;
  }
  const anchor =
    state.anchor !== null && present.has(state.anchor) ? state.anchor : null;
  const focus =
    state.focus !== null && present.has(state.focus) ? state.focus : null;
  if (!dropped && anchor === state.anchor && focus === state.focus) {
    return state;
  }
  return { ...state, selected: new Set(kept), anchor, focus };
}

/**
 * Read the modifier keys of a pointer or keyboard event.
 *
 * `"either"` (default) treats Cmd and Ctrl alike, as TreeView does. On macOS
 * Ctrl+click opens the context menu and fires no click, so accepting both
 * costs nothing there. `"platform"` is strict: Cmd on Apple platforms, Ctrl
 * elsewhere, so the Windows key never toggles.
 * @param {{ shiftKey?: boolean, ctrlKey?: boolean, metaKey?: boolean }} event
 * @param {"either" | "platform"} [modifier]
 * @returns {{ shift: boolean, toggle: boolean }}
 */
export function selectionModifiers(event, modifier = "either") {
  const shift = Boolean(event.shiftKey);
  if (modifier === "platform") {
    return {
      shift,
      toggle: Boolean(isApplePlatform() ? event.metaKey : event.ctrlKey),
    };
  }
  return { shift, toggle: Boolean(event.ctrlKey || event.metaKey) };
}

/**
 * The selection after a click on `key`:
 * click selects it alone, Cmd or Ctrl toggles it, Shift selects the range
 * from the anchor, Cmd or Ctrl with Shift adds the range.
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @param {Key} key
 * @param {SelectionModifiers} modifiers
 * @param {SelectionContext<Key>} ctx
 * @returns {SelectionState<Key>}
 */
export function applyClick(state, key, modifiers, ctx) {
  const { shift = false, toggle = false } = modifiers;
  if (ctx.mode !== "single" && shift) {
    return extendTo(state, key, ctx, toggle ? "add" : "replace");
  }
  if (toggle) return toggleKey(state, key, ctx);
  return selectKey(state, key, ctx);
}

/**
 * @typedef {Object} SelectionKeyOptions
 * @property {boolean} [followFocus=false] - A plain arrow key selects what it focuses (a listbox). Off, it only moves the cursor (a table with checkboxes).
 * @property {"vertical" | "horizontal" | "both"} [axis="vertical"]
 * @property {"range" | "toggle"} [shiftArrow="range"] - Shift+arrow extends the range from the anchor (Finder, Explorer), or toggles the key it lands on (the APG listbox, TreeView).
 * @property {boolean} [rtl=false] - Swap Left and Right on the horizontal axis.
 * @property {boolean} [wrap=false]
 * @property {number} [pageSize] - Page Up and Page Down step by this many; unhandled when unset.
 * @property {boolean} [skipDisabled=true] - Arrow keys step over disabled keys.
 * @property {boolean} [enterSelects=false] - Enter selects the focused key (single mode always does).
 * @property {(focus: SelectionKey | null, event: { key: string }) => SelectionKey | null | undefined} [move] - Pick the next key yourself, for a grid. `undefined` falls back to the default step.
 */

/**
 * @template {SelectionKey} [Key=SelectionKey]
 * @typedef {Object} SelectionKeyResult
 * @property {SelectionState<Key>} state
 * @property {boolean} handled - Call `preventDefault`.
 * @property {Key | null} focus - Where the DOM focus should go, if it moved.
 * @property {"select" | "all" | "clear" | null} intent - What changed the selection, for an announcement.
 */

/**
 * @template {SelectionKey} Key
 * @param {SelectionContext<Key>} ctx
 * @param {number} from
 * @param {1 | -1} step
 * @param {boolean} skip
 * @param {boolean} wrap
 */
function stepIndex(ctx, from, step, skip, wrap) {
  const { order } = ctx;
  const last = order.length - 1;
  let index = from;
  for (let tries = 0; tries <= order.length; tries++) {
    index += step;
    if (index > last) {
      if (!wrap) return -1;
      index = 0;
    } else if (index < 0) {
      if (!wrap) return -1;
      index = last;
    }
    if (!skip || !disabled(ctx, order[index])) return index;
  }
  return -1;
}

/**
 * Apply a key press to the selection.
 *
 * | Key | Effect |
 * | --- | --- |
 * | Arrow | Move the cursor; with `followFocus` also select it |
 * | Cmd or Ctrl + arrow | Move the cursor only |
 * | Shift + arrow | Extend the range from the anchor (or toggle, per `shiftArrow`) |
 * | Home, End | First, last; with Shift extend to it |
 * | Space | Toggle the cursor's key |
 * | Shift + Space | Range from the anchor to the cursor |
 * | Cmd or Ctrl + A | Select all |
 * | Escape | Clear, when something is selected |
 * @template {SelectionKey} Key
 * @param {SelectionState<Key>} state
 * @param {{ key: string, shiftKey?: boolean, ctrlKey?: boolean, metaKey?: boolean, altKey?: boolean }} event
 * @param {SelectionContext<Key> & SelectionKeyOptions} ctx
 * @returns {SelectionKeyResult<Key>}
 */
export function applySelectionKey(state, event, ctx) {
  /** @type {SelectionKeyResult<Key>} */
  const unhandled = { state, handled: false, focus: null, intent: null };
  const { order } = ctx;
  const { key } = event;
  const shift = Boolean(event.shiftKey);
  const mod = Boolean(event.ctrlKey || event.metaKey);
  const multiple = ctx.mode !== "single";
  if (event.altKey) return unhandled;

  if (key === "Escape") {
    if (state.selected.size === 0) return unhandled;
    return {
      state: clearSelection(state),
      handled: true,
      focus: null,
      intent: "clear",
    };
  }

  if (order.length === 0) return unhandled;

  if (mod && !shift && (key === "a" || key === "A")) {
    if (!multiple) return unhandled;
    return {
      state: selectAll(state, ctx),
      handled: true,
      focus: null,
      intent: "all",
    };
  }

  const focus = state.focus;
  const focusIndex = indexOfKey(order, focus);

  if (
    key === " " ||
    key === "Spacebar" ||
    (key === "Enter" && (ctx.enterSelects || !multiple))
  ) {
    if (focus === null || focusIndex === -1) return unhandled;
    if (shift && multiple && key !== "Enter") {
      const next = extendTo(state, focus, ctx, mod ? "add" : "replace");
      return { state: next, handled: true, focus: null, intent: "select" };
    }
    const next = toggleKey(state, focus, ctx);
    return { state: next, handled: true, focus: null, intent: "select" };
  }

  /** @type {Key | null | undefined} */
  let target;
  if (ctx.move) {
    const picked = ctx.move(focus, event);
    if (picked !== undefined) target = /** @type {Key | null} */ (picked);
  }
  if (target === undefined) {
    const vertical = ctx.axis !== "horizontal";
    const horizontal = ctx.axis === "horizontal" || ctx.axis === "both";
    const inline = ctx.rtl ? -1 : 1;
    /** @type {number} */
    let index = -1;
    let known = true;
    const step = (/** @type {1 | -1} */ by) => {
      if (focusIndex === -1) {
        index =
          by === 1
            ? stepIndex(ctx, -1, 1, ctx.skipDisabled !== false, false)
            : stepIndex(
                ctx,
                order.length,
                -1,
                ctx.skipDisabled !== false,
                false,
              );
      } else {
        index = stepIndex(
          ctx,
          focusIndex,
          by,
          ctx.skipDisabled !== false,
          Boolean(ctx.wrap),
        );
      }
    };
    if (vertical && key === "ArrowDown") step(1);
    else if (vertical && key === "ArrowUp") step(-1);
    else if (horizontal && key === "ArrowRight")
      step(/** @type {1 | -1} */ (inline));
    else if (horizontal && key === "ArrowLeft")
      step(/** @type {1 | -1} */ (-inline));
    else if (key === "Home")
      index = stepIndex(ctx, -1, 1, ctx.skipDisabled !== false, false);
    else if (key === "End")
      index = stepIndex(
        ctx,
        order.length,
        -1,
        ctx.skipDisabled !== false,
        false,
      );
    else if (ctx.pageSize && (key === "PageDown" || key === "PageUp")) {
      const by = key === "PageDown" ? ctx.pageSize : -ctx.pageSize;
      const from =
        focusIndex === -1 ? (by > 0 ? -1 : order.length) : focusIndex;
      index = Math.max(0, Math.min(order.length - 1, from + by));
    } else known = false;
    if (!known) return unhandled;
    if (index === -1) {
      return { state, handled: true, focus: null, intent: null };
    }
    target = order[index];
  }
  if (target === null)
    return { state, handled: true, focus: null, intent: null };
  const moved = moveFocus(state, target);
  if (target === focus && !shift) {
    return { state: moved, handled: true, focus: null, intent: null };
  }

  if (shift && multiple) {
    const from = state.focus;
    if (ctx.shiftArrow === "toggle") {
      const next = toggleKey(moved, target, ctx);
      return { state: next, handled: true, focus: target, intent: "select" };
    }
    const base =
      indexOfKey(order, state.anchor) === -1
        ? { ...moved, anchor: from }
        : moved;
    const next = extendTo(
      base,
      target,
      { ...ctx, anchorOnRange: "keep" },
      mod ? "add" : "replace",
    );
    return { state: next, handled: true, focus: target, intent: "select" };
  }

  if (ctx.followFocus && !mod) {
    const next = selectKey(moved, target, ctx);
    return { state: next, handled: true, focus: target, intent: "select" };
  }
  return { state: moved, handled: true, focus: target, intent: null };
}

/**
 * @template {SelectionKey} [Key=SelectionKey]
 * @typedef {Object} SelectionTexts
 * @property {(count: number, hidden: number) => string} [selected] - "3 selected". `hidden` counts selected keys outside the scope.
 * @property {() => string} [cleared]
 */

/**
 * @param {number} count
 * @param {number} hidden
 */
function defaultSelectedText(count, hidden) {
  return hidden > 0
    ? `${count} selected, ${hidden} not shown`
    : `${count} selected`;
}

function defaultClearedText() {
  return "Selection cleared";
}

/**
 * @template {SelectionKey} [Key=SelectionKey]
 * @typedef {Object} CreateSelectionOptions
 * @property {"single" | "multiple"} [mode="multiple"]
 * @property {ReadonlyArray<any> | (() => ReadonlyArray<any>)} [keys] - The keys in the order shown, or items when `getKey` is set. A function is read on every call.
 * @property {(item: any) => Key} [getKey] - Read a key from each entry of `keys`.
 * @property {ReadonlyArray<Key>} [allKeys] - Every key, including ones `keys` leaves out, for `selectAll("all")`.
 * @property {Iterable<Key>} [initial]
 * @property {"keep" | "drop"} [hidden="keep"] - Keys that leave `keys` (a filter) stay selected, or are dropped.
 * @property {(key: Key) => boolean} [isDisabled]
 * @property {"keep" | "move"} [anchorOnRange]
 * @property {SelectionContext<Key>["range"]} [range]
 * @property {boolean} [allowDeselect]
 * @property {SelectionContext<Key>["tree"]} [tree]
 * @property {"either" | "platform"} [modifier="either"]
 * @property {SelectionKeyOptions} [keyboard]
 * @property {(message: string, options?: { channel?: string, debounce?: number, dedupe?: boolean }) => void} [announce] - The C2 `announce`, or any function that says a message.
 * @property {SelectionTexts<Key>} [texts]
 * @property {string} [id] - The announcer channel.
 * @property {number} [announceDelay=250] - Quiet time before a count is said, so holding Shift+Down says the last one.
 */

/**
 * A selection as a Svelte store. `$selection.selected` is the set of keys.
 * @template {SelectionKey} [Key=SelectionKey]
 * @param {CreateSelectionOptions<Key>} [options]
 */
export function createSelection(options = {}) {
  const {
    mode = "multiple",
    getKey,
    hidden = "keep",
    modifier = "either",
    announce,
    announceDelay = 250,
  } = options;
  const texts = options.texts ?? {};
  const channel = options.id ?? "selection";

  /** @type {ReadonlyArray<any> | (() => ReadonlyArray<any>)} */
  let keysInput = options.keys ?? [];
  /** @type {ReadonlyArray<Key>} */
  let allKeys = options.allKeys ?? [];
  let tree = options.tree;
  /** @type {ReadonlyArray<any> | null} */
  let lastInput = null;
  /** @type {ReadonlyArray<Key>} */
  let lastOrder = [];

  /** @type {SelectionState<Key>} */
  let state = createSelectionState(options.initial ?? []);
  /** @type {Set<(state: SelectionState<Key>) => void>} */
  const subscribers = new Set();

  /** @returns {ReadonlyArray<Key>} */
  function currentOrder() {
    const input = typeof keysInput === "function" ? keysInput() : keysInput;
    if (input === lastInput) return lastOrder;
    lastInput = input;
    lastOrder = getKey
      ? input.map(getKey)
      : /** @type {ReadonlyArray<Key>} */ (input);
    return lastOrder;
  }

  /** @returns {SelectionContext<Key>} */
  function context() {
    return {
      order: currentOrder(),
      mode,
      isDisabled: options.isDisabled,
      anchorOnRange: options.anchorOnRange,
      range: options.range,
      allowDeselect: options.allowDeselect,
      tree,
    };
  }

  /** @param {SelectionState<Key>} next */
  function set(next) {
    if (next === state) return false;
    state = next;
    for (const run of subscribers) run(state);
    return true;
  }

  /**
   * @param {"select" | "all" | "clear" | null} intent
   * @param {SelectionState<Key>} before
   */
  function say(intent, before) {
    if (!announce || intent === null || state === before) return;
    const order = currentOrder();
    const { count, hidden: outside } = summarizeSelection(state, order);
    const message =
      intent === "clear" || state.selected.size === 0
        ? (texts.cleared ?? defaultClearedText)()
        : (texts.selected ?? defaultSelectedText)(count, outside);
    announce(message, { channel, debounce: announceDelay, dedupe: true });
  }

  /**
   * @param {(state: SelectionState<Key>, ctx: SelectionContext<Key>) => SelectionState<Key>} change
   * @param {"select" | "all" | "clear"} intent
   */
  function run(change, intent) {
    const before = state;
    set(change(state, context()));
    say(intent, before);
    return state !== before;
  }

  return {
    /** Svelte store contract. */
    subscribe(/** @type {(state: SelectionState<Key>) => void} */ callback) {
      subscribers.add(callback);
      callback(state);
      return () => {
        subscribers.delete(callback);
      };
    },
    get: () => state,
    /** Replace the state, such as a controlled `selectedIds`. Says nothing. */
    set(/** @type {Iterable<Key>} */ keys) {
      const next = createSelectionState(keys, state.anchor, state.focus);
      if (sameSet(next.selected, state.selected)) return;
      set(tree ? commit(state, next, context()) : next);
    },
    /** @returns {Key[]} */
    toArray: () => [...state.selected],
    isSelected: (/** @type {Key} */ key) => state.selected.has(key),
    /** Select `key` alone. */
    select: (/** @type {Key} */ key) =>
      run((current, ctx) => selectKey(current, key, ctx), "select"),
    toggle: (/** @type {Key} */ key, /** @type {boolean} */ force) =>
      run((current, ctx) => toggleKey(current, key, ctx, force), "select"),
    /** Select the range from the anchor to `key` over the current order. */
    extendTo: (
      /** @type {Key} */ key,
      /** @type {"replace" | "add" | "remove"} */ how,
    ) => run((current, ctx) => extendTo(current, key, ctx, how), "select"),
    /** `"order"`: the keys shown. `"all"`: `allKeys`. */
    selectAll: (/** @type {"order" | "all"} */ scope = "order") =>
      run(
        (current, ctx) =>
          selectAll(current, ctx, scope === "all" ? allKeys : ctx.order),
        "all",
      ),
    toggleAll: (/** @type {"clear" | "all"} */ partial) =>
      run((current, ctx) => toggleAll(current, ctx, ctx.order, partial), "all"),
    clear: () => run((current) => clearSelection(current), "clear"),
    moveFocus: (/** @type {Key | null} */ key) => {
      set(moveFocus(state, key));
    },
    /** What a header checkbox shows, over the keys shown. */
    summary: () => {
      const ctx = context();
      return summarizeSelection(state, ctx.order, ctx.isDisabled);
    },
    keyLevel: (/** @type {Key} */ key) => keyLevel(state, key),
    /**
     * Tell the model the order changed (a sort, a filter). With
     * `hidden: "drop"`, keys no longer shown leave the selection.
     * @param {ReadonlyArray<any>} [keys]
     */
    setKeys(keys) {
      if (keys) keysInput = keys;
      if (hidden === "drop") {
        const order = currentOrder();
        set(
          pruneSelection(state, {
            has: (key) => indexOfKey(order, key) !== -1,
          }),
        );
      }
    },
    setAllKeys(/** @type {ReadonlyArray<Key>} */ keys) {
      allKeys = keys;
    },
    setTree(/** @type {SelectionContext<Key>["tree"]} */ next) {
      tree = next;
      set(commit(state, { ...state }, context()));
    },
    /**
     * A click or tap on `key`. Reads Shift and Cmd or Ctrl from the event.
     * @param {{ shiftKey?: boolean, ctrlKey?: boolean, metaKey?: boolean }} event
     * @param {Key} key
     */
    onItemClick: (event, key) =>
      run(
        (current, ctx) =>
          applyClick(current, key, selectionModifiers(event, modifier), ctx),
        "select",
      ),
    /**
     * A key press. Returns the key to focus, or `null`. Calls
     * `preventDefault` when the press was a selection key.
     * @param {KeyboardEvent} event
     * @returns {Key | null}
     */
    onItemKeydown(event) {
      const before = state;
      const result = applySelectionKey(state, event, {
        ...context(),
        ...options.keyboard,
      });
      if (!result.handled) return null;
      event.preventDefault();
      set(result.state);
      say(result.intent, before);
      return result.focus;
    },
    /** The DOM focus moved to `key` (a Tab or a click). */
    onItemFocus: (/** @type {Key} */ key) => {
      set(moveFocus(state, key));
    },
  };
}
