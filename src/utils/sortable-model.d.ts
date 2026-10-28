/** The `detail` of the `sort` event that `sortable` dispatches. */
export interface SortDetail {
  /** The moved item's id, from `getId`. `undefined` when the item has none. */
  id: string | undefined;
  /** The `name` of the list the item came from. */
  from: string;
  /** The `name` of the list the item lands in. The same as `from` for a reorder. */
  to: string;
  /** The item's index in `from` before the move. */
  oldIndex: number;
  /**
   * The item's index in `to` after the move, counted with the item already
   * out of its old place. Use it as is: no adjustment for a later `oldIndex`.
   */
  newIndex: number;
  /** What drove the move. */
  source: "pointer" | "keyboard";
}

/** A copy of `items` with the item at `from` moved to `to`. */
export function moveItem<T>(
  items: ReadonlyArray<T>,
  from: number,
  to: number,
): T[];

/**
 * Apply a `sort` event to your data without mutating it. Pass one array to
 * reorder a single list, or a record of arrays keyed by list `name` to also
 * move items between connected lists.
 */
export function applySort<T>(data: ReadonlyArray<T>, detail: SortDetail): T[];
export function applySort<D extends Record<string, ReadonlyArray<unknown>>>(
  data: D,
  detail: SortDetail,
): { [K in keyof D]: D[K] extends ReadonlyArray<infer T> ? T[] : never };

export function insertionSlot(
  count: number,
  midpoint: (index: number) => number,
  pointer: number,
): number;

export function slotToIndex(
  slot: number,
  oldIndex: number,
  sameList: boolean,
): number;

export function indexToSlot(
  index: number,
  oldIndex: number,
  sameList: boolean,
): number;

export function edgeScrollSpeed(options: {
  pointer: number;
  start: number;
  end: number;
  zone?: number;
  maxSpeed?: number;
  held?: number;
  ramp?: number;
}): number;

export function liftedKeyAction(
  key: string,
  orientation: "vertical" | "horizontal",
  rtl: boolean,
): "back" | "forward" | "prevList" | "nextList" | null;
