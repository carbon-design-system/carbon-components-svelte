import type { Readable } from "svelte/store";

/** One keyboard-navigation model for toolbars, tab lists, listboxes, radio-like groups and grids. */

/**
 * "horizontal" is Left/Right, "vertical" is Up/Down, "both" is a one-line
 * list that answers to all four arrows, and "grid" is two-dimensional.
 */
export type FocusNavOrientation = "horizontal" | "vertical" | "both" | "grid";

/** The line geometry of a grid whose lines are not all `columns` long. Cells are numbered in reading order. */
export type FocusNavLayout = {
  lineCount: number;
  /** The line a cell is on. */
  lineOf: (index: number) => number;
  /** Index of the line's first cell. */
  lineStart: (line: number) => number;
  /** Cells in the line. */
  lineLength: (line: number) => number;
};

export type NextIndexConfig = {
  /** @default "horizontal" */
  orientation?: FocusNavOrientation;
  /**
   * Cells per line in a "grid".
   * @default 1
   */
  columns?: number;
  /** Replaces `columns` for uneven lines. */
  layout?: FocusNavLayout;
  /**
   * Wrap at the ends. `true` for a list, `false` for a "grid".
   */
  wrap?: boolean;
  /**
   * A "grid" only. Left and Right carry on into the next or previous line (a picker), rather than stopping at the line's ends (a spreadsheet).
   * @default false
   */
  flow?: boolean;
  /**
   * Left and Right swap.
   * @default false
   */
  rtl?: boolean;
  /** Cells that never take the cursor, such as disabled ones. Omit it to let the cursor land on them, as a menu does. */
  skip?: (index: number) => boolean;
  /**
   * Items (a list) or lines (a "grid") a Page key moves. 0 leaves the page keys alone.
   * @default 0
   */
  pageSize?: number;
  /**
   * A "grid" only. Columns Alt+PageUp/PageDown move. 0 leaves them alone.
   * @default 0
   */
  pageColumns?: number;
  /** @default true */
  home?: boolean;
  /** @default true */
  end?: boolean;
  /**
   * A "grid" only. Ctrl+Arrow jumps to the edge of the line or column.
   * @default false
   */
  ctrlArrows?: boolean;
};

export type NextIndexState = {
  /** The cell the cursor is on, or `-1` for none. */
  index: number;
  count: number;
  /** A "grid" only. The column Up and Down aim for. Default: the column of `index`. */
  column?: number;
  /** Ctrl or Cmd is held. A "grid" only. */
  ctrl?: boolean;
  /** Alt is held. A "grid" only. */
  alt?: boolean;
};

export type NextIndexResult = {
  /** The cell to move to. `-1` when nothing can take the cursor. */
  index: number;
  /** The column to aim for on the next vertical move. */
  column: number;
};

/** Where `key` takes the cursor. `null` when `key` is not one this configuration moves on, or there are no cells. */
export function nextIndex(
  state: NextIndexState,
  key: string,
  config?: NextIndexConfig,
): NextIndexResult | null;

/** The first cell whose label starts with `query`, searching forward from `from` and wrapping once. `-1` when nothing matches. */
export function typeaheadMatch(options: {
  count: number;
  query: string;
  label: (index: number) => string;
  from: number;
  skip?: (index: number) => boolean;
}): number;

/** The indexes a virtualized widget must keep mounted: the window and the active item. */
export function mountedIndexes(
  start: number,
  end: number,
  active: number,
): number[];

export type FocusNavMove = {
  /** `null` for a typeahead match made from code. */
  event: KeyboardEvent | null;
  /** The key as pressed, before the RTL swap. */
  key: string;
  source: "key" | "typeahead";
  /** Shift was held with a navigation key. */
  extend: boolean;
  /** The index the move started from. */
  from: number;
};

export type FocusNavState = {
  /** The active index, or `-1`. */
  index: number;
  /** The index that holds the roving tab stop: the active one, or the first enabled one while none is active. `-1` when every item is skipped. */
  tabStop: number;
  /** In "activedescendant" mode, the id for `aria-activedescendant`. `null` until the target is mounted. */
  activeId: string | null;
};

export type FocusNavOptions = {
  /** Number of items. Default: the matches of `selector`. */
  count?: number | (() => number);
  orientation?: FocusNavOrientation;
  /** Cells per line. A function is read on each key, for a grid that reflows with its width. */
  columns?: number | (() => number);
  layout?: FocusNavLayout;
  wrap?: boolean;
  flow?: boolean;
  /** Read on each horizontal arrow key. */
  rtl?: boolean | (() => boolean);
  skip?: (index: number) => boolean;
  /** With `selector`: skip items that are `disabled` or `aria-disabled="true"`. `skip` wins. */
  skipDisabled?: boolean;
  pageSize?: number | (() => number);
  pageColumns?: number | (() => number);
  home?: boolean;
  end?: boolean;
  ctrlArrows?: boolean;
  /** Printable keys jump to the next item whose `label` starts with what was typed. */
  typeahead?: false | { label: (index: number) => string; delay?: number };
  /**
   * Where the cursor shows: DOM focus moves to the item ("roving"), or stays on the host and `activeId` points at the item ("activedescendant").
   * @default "roving"
   */
  mode?: "roving" | "activedescendant";
  /**
   * "extend" moves on Shift+key and sets `extend`. "ignore" leaves Shift+key to the element.
   * @default "extend"
   */
  shift?: "extend" | "ignore";
  /**
   * The initial active index.
   * @default -1
   */
  index?: number;
  /** The mounted element, or nothing when virtualization has not rendered it. Default: the matches of `selector`. */
  getItem?: (index: number) => HTMLElement | null | undefined;
  /** The index of the item an element belongs to, or `-1`. Needed for a click or Tab onto an item to become the active one when there is no `selector`. */
  getIndex?: (element: Element) => number;
  /** The id for "activedescendant". Default: the id of `getItem(index)`. */
  getId?: (index: number) => string;
  /** Virtualization hook, called before every move to `index`. Scroll it into view, and return a promise (such as Svelte's `tick()`) when it needs a render to be mounted. Return nothing when it is already in view. */
  reveal?: (index: number) => void | Promise<void>;
  /** Called with the target before the cursor moves. Return `false` to take over. */
  onMove?: (index: number, move: FocusNavMove) => void | false;
  /** Return `true` to leave the key to the focused control. */
  ownsKey?: (event: KeyboardEvent) => boolean;
  /** Passed to `focus()` in "roving" mode. */
  focusOptions?: FocusOptions;
  /** Items inside the node, in DOM order. Also filters which keydown events count. */
  selector?: string;
};

export type FocusNav = Readable<FocusNavState> & {
  /** The active index, or `-1`. */
  readonly index: number;
  /** Move the cursor to `index`, mounting it first when needed. */
  set: (index: number, options?: { focus?: boolean }) => void;
  /** `0` for the active item (or the first, when none is active), `-1` for the rest. */
  tabIndex: (index: number) => 0 | -1;
  /** Clear an `activeId` whose item has unmounted. */
  validate: () => void;
  /** Map a `keydown` to a move. `true` when handled. */
  handleKeydown: (event: KeyboardEvent, at?: { from?: number }) => boolean;
  /** Bind keydown and focus tracking to `node`. */
  attach: (node: HTMLElement) => { destroy: () => void };
  update: (options: FocusNavOptions) => void;
  /** Forget the goal column and any typed prefix. */
  reset: () => void;
};

/** Headless focus navigation: a store of `{ index, activeId }` plus the key handler. */
export function createFocusNav(options?: FocusNavOptions): FocusNav;

/** `createFocusNav` bound to `node`. Pass options, or a controller to read its store. */
export function focusNav(
  node: HTMLElement,
  options: FocusNavOptions | FocusNav,
): {
  update: (options: FocusNavOptions | FocusNav) => void;
  destroy: () => void;
};
