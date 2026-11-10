// @ts-check
// One keyboard-navigation model for composite widgets: toolbars, tab lists,
// listboxes, radio-like groups and grids.
//
// Three layers, each usable alone:
//
// 1. `nextIndex`: a pure function from (position, key, config) to the next
//    position. It knows orientation, wrap, RTL, disabled items, Home/End,
//    paging, and the line geometry of a grid. No DOM, no state.
// 2. `createFocusNav`: a headless controller. It holds the active index and the
//    goal column, maps a `keydown` through `nextIndex`, runs typeahead, asks
//    the widget to mount a target that virtualization has not rendered, then
//    moves DOM focus (roving tabindex) or publishes an id for
//    `aria-activedescendant`. It never owns selection.
// 3. `focusNav`: a Svelte action that binds the controller to a node.

import { get, writable } from "svelte/store";
import { hasModifierKey } from "./has-modifier-key.js";
import { isImeComposition } from "./ime-composition.js";
import { createTypeaheadBuffer, isTypeaheadKey } from "./typeahead.js";

/**
 * @typedef {"horizontal" | "vertical" | "both" | "grid"} FocusNavOrientation
 * "horizontal" is Left/Right, "vertical" is Up/Down, "both" is a one-line
 * list that answers to all four arrows, and "grid" is two-dimensional.
 */

/**
 * The line geometry of a grid whose lines are not all `columns` long: a
 * categorized picker with a short last line per section, or a calendar of
 * time slots. Cells are numbered in reading order.
 *
 * @typedef {Object} FocusNavLayout
 * @property {number} lineCount
 * @property {(index: number) => number} lineOf - The line a cell is on.
 * @property {(line: number) => number} lineStart - Index of the line's first cell.
 * @property {(line: number) => number} lineLength - Cells in the line.
 */

/**
 * @typedef {Object} NextIndexConfig
 * @property {FocusNavOrientation} [orientation] - Default "horizontal".
 * @property {number} [columns] - Cells per line in a "grid". Default 1.
 * @property {FocusNavLayout} [layout] - Replaces `columns` for uneven lines.
 * @property {boolean} [wrap] - Wrap at the ends. Default `true` for a list, `false` for a "grid".
 * @property {boolean} [flow] - A "grid" only. Left and Right carry on into the next or previous line (a picker), rather than stopping at the line's ends (a spreadsheet). Default `false`.
 * @property {boolean} [rtl] - Left and Right swap. Default `false`.
 * @property {(index: number) => boolean} [skip] - Cells that never take the cursor, such as disabled ones. Omit it to let the cursor land on them, as a menu does.
 * @property {number} [pageSize] - Items (a list) or lines (a "grid") a Page key moves. Default 0: the page keys are not handled.
 * @property {number} [pageColumns] - A "grid" only. Columns Alt+PageUp/PageDown move. Default 0: not handled.
 * @property {boolean} [home] - Home is handled. Default `true`.
 * @property {boolean} [end] - End is handled. Default `true`.
 * @property {boolean} [ctrlArrows] - A "grid" only. Ctrl+Arrow jumps to the edge of the line or column, as a spreadsheet does. Default `false`.
 */

/**
 * @typedef {Object} NextIndexState
 * @property {number} index - The cell the cursor is on, or `-1` for none.
 * @property {number} count - Number of cells.
 * @property {number} [column] - A "grid" only. The column Up and Down aim for. Default: the column of `index`.
 * @property {boolean} [ctrl] - Ctrl or Cmd is held. A "grid" only: Ctrl+Home/End go to the ends of the grid.
 * @property {boolean} [alt] - Alt is held. A "grid" only: Alt+PageUp/PageDown move by columns.
 */

/**
 * @typedef {Object} NextIndexResult
 * @property {number} index - The cell to move to. `-1` when nothing can take the cursor.
 * @property {number} column - The column to aim for on the next vertical move.
 */

const ARROWS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
const GRID_KEYS = [...ARROWS, "Home", "End", "PageUp", "PageDown"];

/**
 * @param {number} count
 * @param {number} columns
 * @param {FocusNavLayout | undefined} layout
 * @returns {FocusNavLayout}
 */
function geometry(count, columns, layout) {
  if (layout) return layout;
  const width = Math.max(1, Math.floor(columns) || 1);
  return {
    lineCount: Math.ceil(count / width),
    lineOf: (index) => Math.floor(index / width),
    lineStart: (line) => line * width,
    lineLength: (line) => Math.min(width, count - line * width),
  };
}

/** @param {number} value @param {number} low @param {number} high */
function clamp(value, low, high) {
  return Math.min(Math.max(value, low), high);
}

/** @param {number} value @param {number} size */
function mod(value, size) {
  return ((value % size) + size) % size;
}

/**
 * Where `key` takes the cursor, as a pure function.
 *
 * Lists (`horizontal`, `vertical`, `both`): the arrows of the axis step by
 * one and wrap, Home and End go to the ends, and Page keys move `pageSize`
 * items, clamped. Ctrl, Alt and Meta leave every key to the browser.
 *
 * Grids: Left and Right step within the line, or carry on into the next line
 * with `flow`. Up and Down keep the column (a short line clamps to its end,
 * and the column comes back on the next line). Home and End go to the ends of
 * the line, and with Ctrl to the ends of the grid. Page keys move `pageSize`
 * lines and never wrap.
 *
 * Cells `skip` rejects are passed over in the direction of travel. When there
 * is nothing to land on that way, the cursor stays. Left and Right swap with
 * `rtl`; Home, End and the Page keys do not.
 *
 * From `index` `-1` a key enters the widget: at the last enabled cell for a
 * backward key (Up, Left, End, PageUp), at the first otherwise.
 *
 * @param {NextIndexState} state
 * @param {string} key - A `KeyboardEvent` key.
 * @param {NextIndexConfig} [config]
 * @returns {NextIndexResult | null} `null` when `key` is not one this configuration moves on, or there are no cells.
 */
export function nextIndex(state, key, config = {}) {
  const { index, count, column, ctrl = false, alt = false } = state;
  const {
    orientation = "horizontal",
    skip,
    rtl = false,
    pageSize = 0,
    home = true,
    end = true,
  } = config;
  if (count <= 0 || !GRID_KEYS.includes(key)) return null;

  const grid = orientation === "grid";
  const wrap = config.wrap ?? !grid;
  /** @param {number} i */
  const blocked = (i) => skip?.(i) === true;
  const hasIndex = index >= 0 && index < count;

  // Left and Right as an LTR page reads them: Right is toward the inline end.
  const logical =
    rtl && (key === "ArrowLeft" || key === "ArrowRight")
      ? key === "ArrowLeft"
        ? "ArrowRight"
        : "ArrowLeft"
      : key;

  /**
   * First cell from `start` going `dir` that `skip` accepts, up to and
   * including `stop`.
   * @param {number} start
   * @param {1 | -1} dir
   * @param {number} stop
   */
  function scan(start, dir, stop) {
    for (let i = start; dir === 1 ? i <= stop : i >= stop; i += dir) {
      if (!blocked(i)) return i;
    }
    return -1;
  }

  /**
   * Land on `target`, or the closest cell past it going `dir`, or failing
   * that the closest one back toward `origin`. `origin` if none.
   * @param {number} target
   * @param {1 | -1} dir
   * @param {number} origin
   * @param {number} first
   * @param {number} last
   */
  function land(target, dir, origin, first, last) {
    const ahead = scan(target, dir, dir === 1 ? last : first);
    if (ahead >= 0) return ahead;
    const back = scan(target - dir, /** @type {1 | -1} */ (-dir), origin);
    return back >= 0 ? back : origin;
  }

  if (!grid) {
    if (ctrl || alt) return null;
    const inline = orientation !== "vertical";
    const block = orientation !== "horizontal";
    const forward =
      (inline && logical === "ArrowRight") ||
      (block && logical === "ArrowDown");
    const backward =
      (inline && logical === "ArrowLeft") || (block && logical === "ArrowUp");
    const last = count - 1;

    /** @param {number} i */
    const result = (i) => ({ index: i, column: 0 });

    if (forward || backward) {
      const dir = forward ? 1 : -1;
      let at = index;
      for (let n = 0; n < count; n++) {
        let next = at + dir;
        if (at < 0) next = dir === 1 ? 0 : last;
        else if (wrap) next = mod(next, count);
        else next = clamp(next, 0, last);
        if (next === at) break;
        at = next;
        if (!blocked(at)) return result(at);
      }
      return result(index);
    }
    if (logical === "Home" && home) return result(scan(0, 1, last));
    if (logical === "End" && end) return result(scan(last, -1, 0));
    if (pageSize > 0 && (logical === "PageUp" || logical === "PageDown")) {
      const dir = logical === "PageDown" ? 1 : -1;
      if (!hasIndex)
        return result(dir === 1 ? scan(0, 1, last) : scan(last, -1, 0));
      const target = clamp(index + dir * pageSize, 0, last);
      return result(land(target, dir, index, 0, last));
    }
    return null;
  }

  // Grid.
  const geo = geometry(count, config.columns ?? 1, config.layout);
  const last = count - 1;
  /** @param {number} i */
  const columnOf = (i) => i - geo.lineStart(geo.lineOf(i));
  /** @param {number} i */
  const result = (i) => ({ index: i, column: i < 0 ? 0 : columnOf(i) });
  const backward =
    logical === "ArrowUp" ||
    logical === "ArrowLeft" ||
    logical === "PageUp" ||
    logical === "End";

  if (!hasIndex) {
    if (alt && !logical.startsWith("Page")) return null;
    return result(backward ? scan(last, -1, 0) : scan(0, 1, last));
  }

  const line = geo.lineOf(index);
  const start = geo.lineStart(line);
  const length = geo.lineLength(line);
  const goal = column ?? columnOf(index);

  /**
   * The cell in `target` line at the goal column, then the next lines in
   * `dir` while the cell is skipped.
   * @param {number} target
   * @param {1 | -1} dir
   * @param {boolean} allowWrap
   */
  function vertical(target, dir, allowWrap) {
    const lines = geo.lineCount;
    let at = allowWrap ? mod(target, lines) : clamp(target, 0, lines - 1);
    for (let n = 0; n < lines; n++) {
      if (at === line) break;
      const cell = geo.lineStart(at) + Math.min(goal, geo.lineLength(at) - 1);
      if (!blocked(cell)) return { index: cell, column: goal };
      const next = at + dir;
      if (allowWrap) at = mod(next, lines);
      else if (next < 0 || next >= lines) break;
      else at = next;
    }
    return { index, column: goal };
  }

  /**
   * A column `target` of the current line, then past it going `dir`.
   * @param {number} target
   * @param {1 | -1} dir
   * @param {boolean} allowWrap
   */
  function inLine(target, dir, allowWrap) {
    const here = index - start;
    let at = allowWrap ? mod(target, length) : clamp(target, 0, length - 1);
    for (let n = 0; n < length; n++) {
      if (at === here) break;
      if (!blocked(start + at)) return result(start + at);
      const next = at + dir;
      if (allowWrap) at = mod(next, length);
      else if (next < 0 || next >= length) break;
      else at = next;
    }
    return result(index);
  }

  /** Left and Right carrying on across lines. */
  function flowing(/** @type {1 | -1} */ dir) {
    let at = index;
    for (let n = 0; n < count; n++) {
      let next = at + dir;
      next = wrap ? mod(next, count) : clamp(next, 0, last);
      if (next === at) break;
      at = next;
      if (!blocked(at)) return result(at);
    }
    return result(index);
  }

  switch (logical) {
    case "ArrowRight":
    case "ArrowLeft": {
      const dir = logical === "ArrowRight" ? 1 : -1;
      if (alt) return null;
      if (ctrl) {
        if (!config.ctrlArrows) return null;
        return result(
          dir === 1
            ? scan(start + length - 1, -1, start)
            : scan(start, 1, start + length - 1),
        );
      }
      return config.flow
        ? flowing(dir)
        : inLine(index - start + dir, dir, wrap);
    }
    case "ArrowDown":
    case "ArrowUp": {
      const dir = logical === "ArrowDown" ? 1 : -1;
      if (alt) return null;
      if (ctrl) {
        if (!config.ctrlArrows) return null;
        const edge = dir === 1 ? geo.lineCount - 1 : 0;
        return vertical(edge, /** @type {1 | -1} */ (-dir), false);
      }
      return vertical(line + dir, dir, wrap);
    }
    case "Home":
    case "End": {
      if (alt) return null;
      if (logical === "Home" ? !home : !end) return null;
      if (logical === "Home") {
        return result(
          ctrl ? scan(0, 1, last) : scan(start, 1, start + length - 1),
        );
      }
      return result(
        ctrl ? scan(last, -1, 0) : scan(start + length - 1, -1, start),
      );
    }
    default: {
      // PageUp, PageDown.
      if (ctrl) return null;
      const dir = logical === "PageDown" ? 1 : -1;
      if (alt) {
        const columns = config.pageColumns ?? 0;
        if (columns <= 0) return null;
        const here = index - start;
        return inLine(clamp(here + dir * columns, 0, length - 1), dir, false);
      }
      if (pageSize <= 0) return null;
      const target = clamp(line + dir * pageSize, 0, geo.lineCount - 1);
      return vertical(target, dir, false);
    }
  }
}

/**
 * The first cell whose label starts with `query`, searching forward from
 * `from` and wrapping once. A one-character query starts after `from`, so
 * repeating a letter walks through the matches. A longer query starts at
 * `from`, so completing a word does not leave the cell it is already on.
 * Returns `-1` when nothing matches.
 *
 * @param {Object} options
 * @param {number} options.count
 * @param {string} options.query
 * @param {(index: number) => string} options.label
 * @param {number} options.from - May be -1.
 * @param {(index: number) => boolean} [options.skip]
 * @returns {number}
 */
export function typeaheadMatch({ count, query, label, from, skip }) {
  if (query === "" || count <= 0) return -1;
  const needle = query.toLowerCase();
  const first = from >= 0 && query.length > 1 ? from : from + 1;
  for (let offset = 0; offset < count; offset++) {
    const i = (((first + offset) % count) + count) % count;
    if (skip?.(i) === true) continue;
    if (label(i).toLowerCase().startsWith(needle)) return i;
  }
  return -1;
}

/**
 * The indexes a virtualized widget must keep mounted: the visible window and
 * the active item, so the roving tab stop (or the target of
 * `aria-activedescendant`) never unmounts when it scrolls out of view.
 *
 * @param {number} start - First index of the window.
 * @param {number} end - One past the last index of the window.
 * @param {number} active - Index of the active item, or `-1`.
 * @returns {number[]} In order.
 */
export function mountedIndexes(start, end, active) {
  /** @type {number[]} */
  const indexes = [];
  const outside = active >= 0 && (active < start || active >= end);
  if (outside && active < start) indexes.push(active);
  for (let i = start; i < end; i++) indexes.push(i);
  if (outside && active >= end) indexes.push(active);
  return indexes;
}

/**
 * What `onMove` receives about the key.
 *
 * @typedef {Object} FocusNavMove
 * @property {KeyboardEvent | null} event - `null` for a typeahead match made from code.
 * @property {string} key - The key as pressed, before the RTL swap.
 * @property {"key" | "typeahead"} source
 * @property {boolean} extend - Shift was held with a navigation key. The controller moves the cursor anyway; the widget decides whether that also extends a selection (see `createSelection`'s `extendTo`).
 * @property {number} from - The index the move started from.
 */

/**
 * @typedef {Object} FocusNavState
 * @property {number} index - The active index, or `-1`.
 * @property {number} tabStop - The index that holds the roving tab stop: the active one, or the first enabled one while none is active. `-1` when every item is skipped.
 * @property {string | null} activeId - In "activedescendant" mode, the id for `aria-activedescendant`. `null` until the target is mounted, so it never points at nothing.
 */

/**
 * @typedef {Object} FocusNavOptions
 * @property {number | (() => number)} [count] - Number of items. Default: the matches of `selector`.
 * @property {FocusNavOrientation} [orientation]
 * @property {number | (() => number)} [columns] - Cells per line. A function is read on each key, for a grid that reflows with its width.
 * @property {FocusNavLayout} [layout]
 * @property {boolean} [wrap]
 * @property {boolean} [flow]
 * @property {boolean | (() => boolean)} [rtl] - Read on each horizontal arrow key.
 * @property {(index: number) => boolean} [skip]
 * @property {boolean} [skipDisabled] - With `selector`: skip items that are `disabled` or `aria-disabled="true"`. `skip` wins.
 * @property {number | (() => number)} [pageSize]
 * @property {number | (() => number)} [pageColumns]
 * @property {boolean} [home]
 * @property {boolean} [end]
 * @property {boolean} [ctrlArrows]
 * @property {false | { label: (index: number) => string, delay?: number }} [typeahead] - Printable keys jump to the next item whose `label` starts with what was typed.
 * @property {"roving" | "activedescendant"} [mode] - Where the cursor shows: DOM focus moves to the item ("roving"), or stays on the host and `activeId` points at the item ("activedescendant"). Default "roving".
 * @property {"extend" | "ignore"} [shift] - "extend" (default) moves on Shift+key and sets `extend`. "ignore" leaves Shift+key to the element, such as text selection in a search field.
 * @property {number} [index] - The initial active index. Default `-1`.
 * @property {(index: number) => HTMLElement | null | undefined} [getItem] - The mounted element, or nothing when virtualization has not rendered it. Default: the matches of `selector`.
 * @property {(element: Element) => number} [getIndex] - The index of the item an element belongs to, or `-1`. Lets a click or Tab onto an item, and a key pressed on it, start from that item when there is no `selector` to find it by (a virtualized list).
 * @property {(index: number) => string} [getId] - The id for "activedescendant". Default: the id of `getItem(index)`.
 * @property {(index: number) => void | Promise<void>} [reveal] - Virtualization hook, called before every move to `index`. Scroll it into view, and return a promise (such as Svelte's `tick()`) when it needs a render to be mounted. Focus or `activeId` follow once the promise settles. Return nothing when it is already in view. A newer move supersedes a pending one.
 * @property {(index: number, move: FocusNavMove) => void | false} [onMove] - Called with the target before the cursor moves. Return `false` to take over (an extending Shift move that keeps the active cell, say); then call `set` yourself if the cursor should follow.
 * @property {(event: KeyboardEvent) => boolean} [ownsKey] - Return `true` to leave the key to the focused control, such as the caret keys of a text field inside a toolbar.
 * @property {FocusOptions} [focusOptions] - Passed to `focus()` in "roving" mode. `{ preventScroll: true }` when the widget scrolls itself.
 * @property {string} [selector] - Items inside the node `attach` binds to, in DOM order. Also filters which keydown events count.
 */

/**
 * @template T
 * @param {T | (() => T)} value
 * @returns {T}
 */
function read(value) {
  return typeof value === "function" ? /** @type {() => T} */ (value)() : value;
}

/**
 * @param {Element} element
 * @returns {boolean}
 */
function isDisabledElement(element) {
  return (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  );
}

/**
 * Headless focus navigation. The controller is also a Svelte store of
 * `{ index, tabStop, activeId }`, so markup can write
 * `tabindex={i === $nav.tabStop ? 0 : -1}` and `aria-activedescendant={$nav.activeId}`.
 *
 * @param {FocusNavOptions} [options]
 */
export function createFocusNav(options = {}) {
  let config = options;
  /** @type {HTMLElement | null} */
  let root = null;
  /** @type {HTMLElement[] | null} */
  let itemCache = null;
  let sequence = 0;
  /** @type {number | undefined} */
  let goalColumn;
  let goalIndex = -2;
  /** @type {ReturnType<typeof createTypeaheadBuffer> | null} */
  let buffer = null;
  let bufferDelay = -1;

  let current = options.index ?? -1;
  const store = writable(
    /** @type {FocusNavState} */ ({
      index: current,
      tabStop: -1,
      activeId: null,
    }),
  );

  /**
   * @param {number} index
   * @param {string | null} activeId
   */
  function publish(index, activeId) {
    store.set({
      index,
      tabStop: index >= 0 ? index : firstIndex(),
      activeId,
    });
  }

  function items() {
    if (!root || !config.selector) return [];
    itemCache ??= /** @type {HTMLElement[]} */ (
      Array.from(root.querySelectorAll(config.selector))
    );
    return itemCache;
  }

  function count() {
    if (config.count !== undefined) return read(config.count);
    return items().length;
  }

  /** @param {number} index */
  function getItem(index) {
    if (config.getItem) return config.getItem(index);
    return items()[index] ?? null;
  }

  /** @returns {((index: number) => boolean) | undefined} */
  function skipOf() {
    if (config.skip) return config.skip;
    if (config.skipDisabled) {
      return (index) => {
        const item = getItem(index);
        return item ? isDisabledElement(item) : false;
      };
    }
    return undefined;
  }

  /** @param {number} index */
  function idOf(index) {
    if (config.getId) return config.getId(index);
    return getItem(index)?.id ?? null;
  }

  /**
   * @param {number} index
   * @param {boolean} focus
   */
  function apply(index, focus) {
    const item = getItem(index);
    if (config.mode === "activedescendant") {
      // Point at an item only once it is in the DOM, when that can be told.
      const lookup = config.getItem || config.selector;
      const id = item || !lookup ? idOf(index) : null;
      publish(index, id || null);
      return;
    }
    publish(index, null);
    if (focus && item) item.focus(config.focusOptions);
  }

  /**
   * Move the cursor to `index`: mount it if virtualization has not, then
   * focus it or publish its id. The index updates at once, so keys that
   * arrive while a mount is pending keep moving from the newest target.
   *
   * @param {number} index
   * @param {{ focus?: boolean }} [options] - `focus: false` moves the tab stop or id without moving DOM focus.
   */
  function set(index, { focus = true } = {}) {
    itemCache = null;
    current = index;
    sequence += 1;
    const ticket = sequence;
    const pending = index >= 0 ? config.reveal?.(index) : undefined;
    if (pending && typeof pending.then === "function") {
      publish(index, null);
      pending.then(() => {
        itemCache = null;
        if (ticket === sequence) apply(index, focus);
      });
      return;
    }
    itemCache = null;
    apply(index, focus);
  }

  /**
   * @param {KeyboardEvent} event
   * @param {number} from
   * @returns {boolean}
   */
  function handleTypeahead(event, from) {
    const { typeahead } = config;
    if (!typeahead || !isTypeaheadKey(event)) return false;
    const delay = typeahead.delay ?? 500;
    if (!buffer || delay !== bufferDelay) {
      buffer = createTypeaheadBuffer(delay);
      bufferDelay = delay;
    }
    const query = buffer.push(event.key);
    const index = typeaheadMatch({
      count: count(),
      query,
      label: typeahead.label,
      from,
      skip: skipOf(),
    });
    if (index < 0) return false;
    event.preventDefault();
    commit(index, {
      event,
      key: event.key,
      source: "typeahead",
      extend: false,
      from,
    });
    return true;
  }

  /**
   * @param {number} index
   * @param {FocusNavMove} move
   */
  function commit(index, move) {
    if (config.onMove?.(index, move) === false) return;
    set(index);
  }

  /**
   * Map a `keydown` to a move. Returns whether the key was handled; a handled
   * key has had `preventDefault` called.
   *
   * @param {KeyboardEvent} event
   * @param {{ from?: number }} [at] - Move from this index instead of the active one, such as the cell under focus when the pointer moved it.
   * @returns {boolean}
   */
  function handleKeydown(event, at = {}) {
    if (event.defaultPrevented || isImeComposition(event)) return false;
    if (config.ownsKey?.(event)) return false;
    itemCache = null;
    const from = at.from ?? current;
    const orientation = config.orientation ?? "horizontal";
    const grid = orientation === "grid";

    if (!hasModifierKey(event) && handleTypeahead(event, from)) return true;
    if (event.shiftKey && config.shift === "ignore") return false;
    if (!grid && hasModifierKey(event)) return false;
    if (grid && event.altKey && !event.key.startsWith("Page")) return false;

    const total = count();
    const useColumn = goalIndex === from;
    const result = nextIndex(
      {
        index: from,
        count: total,
        column: useColumn ? goalColumn : undefined,
        ctrl: grid && (event.ctrlKey || event.metaKey),
        alt: grid && event.altKey,
      },
      event.key,
      {
        orientation,
        columns: read(config.columns),
        layout: config.layout,
        wrap: config.wrap,
        flow: config.flow,
        rtl: read(config.rtl ?? false),
        skip: skipOf(),
        pageSize: read(config.pageSize ?? 0),
        pageColumns: read(config.pageColumns ?? 0),
        home: config.home,
        end: config.end,
        ctrlArrows: config.ctrlArrows,
      },
    );
    if (!result) return false;

    event.preventDefault();
    if (result.index < 0) return true;
    goalColumn = result.column;
    goalIndex = result.index;
    commit(result.index, {
      event,
      key: event.key,
      source: "key",
      extend: event.shiftKey,
      from,
    });
    return true;
  }

  /**
   * The `tabindex` for item `index` in a roving widget: `0` for the active
   * item, or for the first one when nothing is active yet, `-1` for the rest.
   *
   * @param {number} index
   * @returns {0 | -1}
   */
  function tabIndex(index) {
    return index === (current >= 0 ? current : firstIndex()) ? 0 : -1;
  }

  function firstIndex() {
    const skip = skipOf();
    const total = count();
    for (let i = 0; i < total; i++) {
      if (skip?.(i) !== true) return i;
    }
    return -1;
  }

  /**
   * Check that the active item is still mounted. A virtualized widget calls
   * this after it re-renders: an `activeId` for an item that scrolled out
   * would point at nothing, so it is cleared until `set` or `reveal` brings
   * the item back.
   */
  function validate() {
    if (config.mode !== "activedescendant" || current < 0) return;
    itemCache = null;
    if (getItem(current)) apply(current, false);
    else publish(current, null);
  }

  /**
   * Bind to `node`: keydown, plus focus and click tracking in "roving" mode so a
   * click or Tab onto an item becomes the active one, and the `aria-activedescendant`
   * attribute in "activedescendant" mode.
   *
   * @param {HTMLElement} node
   * @returns {{ destroy: () => void }}
   */
  function attach(node) {
    root = node;
    itemCache = null;
    publish(current, get(store).activeId);

    /**
     * The item index an element belongs to, or -1: `getIndex` when given,
     * else the position of the closest `selector` match.
     * @param {Element} target
     */
    function indexOfTarget(target) {
      if (config.getIndex) return config.getIndex(target);
      if (!config.selector) return -1;
      const item = target.closest(config.selector);
      if (!item || !node.contains(item)) return -1;
      itemCache = null;
      return items().indexOf(/** @type {HTMLElement} */ (item));
    }

    /** @param {KeyboardEvent} event */
    function onKeydown(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      let from;
      if (target !== node) {
        const found = indexOfTarget(target);
        // With a selector, keys from elsewhere in the node are not ours.
        if (found < 0 && config.selector && !config.getIndex) return;
        // Start from the item that holds focus, not a stale index.
        if (found >= 0 && config.mode !== "activedescendant") from = found;
      }
      handleKeydown(event, from === undefined ? {} : { from });
    }

    // A click makes the item the tab stop. Safari does not focus a button,
    // radio or checkbox on click, so `focusin` alone would leave the tab stop
    // on the item that was active before.
    /** @param {Event} event */
    function onItemFocus(event) {
      if (config.mode === "activedescendant") return;
      const target = event.target;
      if (!(target instanceof Element) || target === node) return;
      const found = indexOfTarget(target);
      if (found >= 0 && found !== current) {
        current = found;
        publish(found, null);
      }
    }

    const unsubscribe = store.subscribe(({ activeId }) => {
      if (config.mode !== "activedescendant") return;
      if (activeId) node.setAttribute("aria-activedescendant", activeId);
      else node.removeAttribute("aria-activedescendant");
    });

    node.addEventListener("keydown", onKeydown);
    node.addEventListener("focusin", onItemFocus);
    node.addEventListener("click", onItemFocus);
    return {
      destroy() {
        node.removeEventListener("keydown", onKeydown);
        node.removeEventListener("focusin", onItemFocus);
        node.removeEventListener("click", onItemFocus);
        unsubscribe();
        buffer?.clear();
        if (root === node) root = null;
      },
    };
  }

  publish(current, null);

  return {
    subscribe: store.subscribe,
    /** The active index, or `-1`. */
    get index() {
      return current;
    },
    set,
    tabIndex,
    validate,
    handleKeydown,
    attach,
    /** @param {FocusNavOptions} next */
    update(next) {
      config = next;
      itemCache = null;
      // The first enabled item holds the tab stop until one is active.
      publish(current, get(store).activeId);
    },
    /** Forget the goal column and any typed prefix, such as when the widget closes. */
    reset() {
      goalColumn = undefined;
      goalIndex = -2;
      buffer?.clear();
    },
  };
}

/**
 * Svelte action: `createFocusNav` bound to `node`. Pass options, or a
 * controller you made yourself to read its store.
 *
 * ```svelte
 * <ul use:focusNav={{ selector: "[role=tab]", skipDisabled: true }}>
 * ```
 *
 * @param {HTMLElement} node
 * @param {FocusNavOptions | ReturnType<typeof createFocusNav>} param
 */
export function focusNav(node, param) {
  const isController = (
    /** @type {FocusNavOptions | ReturnType<typeof createFocusNav>} */ value,
  ) => typeof (/** @type {any} */ (value).handleKeydown) === "function";
  let nav = isController(param)
    ? /** @type {ReturnType<typeof createFocusNav>} */ (param)
    : createFocusNav(/** @type {FocusNavOptions} */ (param));
  let binding = nav.attach(node);

  return {
    /** @param {FocusNavOptions | ReturnType<typeof createFocusNav>} next */
    update(next) {
      if (isController(next)) {
        if (next === nav) return;
        binding.destroy();
        nav = /** @type {ReturnType<typeof createFocusNav>} */ (next);
        binding = nav.attach(node);
        return;
      }
      nav.update(/** @type {FocusNavOptions} */ (next));
    },
    destroy() {
      binding.destroy();
    },
  };
}
