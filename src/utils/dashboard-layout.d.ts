/** One widget's place on the grid, in cells. `x` and `y` count from 0. */
export interface DashboardGridLayoutItem {
  /** Names the `DashboardGridItem` this places. */
  id: string;
  /** Column of the item's first cell, from the inline start. */
  x: number;
  /** Row of the item's first cell, from the top. */
  y: number;
  /** Width in columns. */
  w: number;
  /** Height in rows. */
  h: number;
  /** @default 1 */
  minW?: number;
  /** @default the number of columns */
  maxW?: number;
  /** @default 1 */
  minH?: number;
  /** @default no limit */
  maxH?: number;
  /** An item that cannot be moved or resized, and that others cannot push. */
  static?: boolean;
}

/** Options shared by the layout functions. */
export interface DashboardGridLayoutOptions {
  /** The number of columns of the layout. */
  cols: number;
  /**
   * `"vertical"` lifts every item up against the top or the item above it;
   * `"none"` leaves gaps where you put them.
   * @default "vertical"
   */
  compact?: "vertical" | "none";
  /**
   * `"push"` moves the items an item lands on out of its way; `"prevent"`
   * refuses a move or resize onto another item.
   * @default "push"
   */
  collision?: "push" | "prevent";
}

/** Coerce an item into the grid: whole numbers, limits, and inside the columns. */
export function normalizeItem(
  item: DashboardGridLayoutItem,
  cols: number,
): DashboardGridLayoutItem;

/** Normalize every item. A repeated `id` keeps its first item. */
export function normalizeLayout(
  layout: ReadonlyArray<DashboardGridLayoutItem>,
  cols: number,
): DashboardGridLayoutItem[];

/** The number of rows the layout occupies. */
export function layoutRows(
  layout: ReadonlyArray<DashboardGridLayoutItem>,
): number;

/** Normalize a layout and settle it so no two items overlap. */
export function compactLayout(
  layout: ReadonlyArray<DashboardGridLayoutItem>,
  cols: number,
  compact?: "vertical" | "none",
): DashboardGridLayoutItem[];

/** Sort in reading order: top to bottom, then start to end. */
export function sortLayout(
  layout: ReadonlyArray<DashboardGridLayoutItem>,
): DashboardGridLayoutItem[];

/**
 * Move an item to a cell. Returns `layout` itself when the move cannot be
 * made.
 */
export function moveLayoutItem(
  layout: ReadonlyArray<DashboardGridLayoutItem>,
  id: string,
  x: number,
  y: number,
  options: DashboardGridLayoutOptions,
): DashboardGridLayoutItem[];

/**
 * Resize an item. Returns `layout` itself when the resize cannot be made.
 */
export function resizeLayoutItem(
  layout: ReadonlyArray<DashboardGridLayoutItem>,
  id: string,
  w: number,
  h: number,
  options: DashboardGridLayoutOptions,
): DashboardGridLayoutItem[];

/**
 * Move an item to the nearest position in a direction that changes the
 * layout. Returns `layout` itself when there is none.
 */
export function nudgeLayoutItem(
  layout: ReadonlyArray<DashboardGridLayoutItem>,
  id: string,
  dx: -1 | 0 | 1,
  dy: -1 | 0 | 1,
  options: DashboardGridLayoutOptions,
): DashboardGridLayoutItem[];

/** Whether two layouts put every item in the same place at the same size. */
export function layoutsEqual(
  a: ReadonlyArray<DashboardGridLayoutItem>,
  b: ReadonlyArray<DashboardGridLayoutItem>,
): boolean;

/**
 * Bring a stored layout in line with the widgets you have now: drop ids you
 * no longer have, add ids that are new, and ignore input that is not a layout.
 */
export function reconcileLayout(
  stored: unknown,
  defaults: ReadonlyArray<DashboardGridLayoutItem>,
): DashboardGridLayoutItem[];

type BreakpointSize = import("../Breakpoint/breakpoints.js").BreakpointSize;

/** The breakpoints a grid has a layout for, smallest first. */
export const DASHBOARD_BREAKPOINTS: ReadonlyArray<BreakpointSize>;

/** The columns of the Carbon grid at each breakpoint. */
export const DASHBOARD_DEFAULT_COLS: Readonly<Record<BreakpointSize, number>>;

/** The Carbon breakpoint for a viewport width, as the media queries pick it. */
export function breakpointAt(width: number): BreakpointSize;

/** Columns at every breakpoint. */
export function resolveColumns(
  cols: number | Partial<Record<BreakpointSize, number>> | undefined,
): Record<BreakpointSize, number>;

/** The layout at every breakpoint, derived where none is given. */
export function resolveLayouts(
  given: Partial<
    Record<BreakpointSize, ReadonlyArray<DashboardGridLayoutItem>>
  >,
  cols: Record<BreakpointSize, number>,
  compact?: "vertical" | "none",
): Record<BreakpointSize, DashboardGridLayoutItem[]>;

/** The CSS custom properties that place each item, by item id. */
export function placementStyles(
  lists: Record<BreakpointSize, ReadonlyArray<DashboardGridLayoutItem>>,
): Map<string, string>;
