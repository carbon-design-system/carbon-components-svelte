export type TransferListId = string | number;

export type TransferListRow = {
  id: TransferListId;
  text: string;
  disabled?: boolean;
};

/** Splits `items` into the available list and the selected list, in the selected order. */
export function partitionItems<T extends TransferListRow>(
  items: ReadonlyArray<T>,
  selectedIds: ReadonlyArray<TransferListId>,
): { available: T[]; selected: T[] };

/** Case-insensitive match anywhere in the item's text. */
export function defaultShouldFilterItem(
  item: TransferListRow,
  value: string,
): boolean;

/** The rows a search leaves. */
export function filterRows<T extends TransferListRow>(
  rows: ReadonlyArray<T>,
  value: string,
  shouldFilter?: (item: T, value: string) => boolean,
): ReadonlyArray<T>;

/** Ids to the end of the selected list. */
export function addIds(
  selectedIds: ReadonlyArray<TransferListId>,
  ids: ReadonlyArray<TransferListId>,
): TransferListId[];

/** The selected ids without `ids`. */
export function removeIds(
  selectedIds: ReadonlyArray<TransferListId>,
  ids: ReadonlyArray<TransferListId>,
): TransferListId[];

/** Moves the marked ids within the visible ones. Returns `selectedIds` when nothing moves. */
export function reorderIds(
  selectedIds: ReadonlyArray<TransferListId>,
  visibleIds: ReadonlyArray<TransferListId>,
  marked: ReadonlySet<TransferListId>,
  direction: "up" | "down" | "top" | "bottom",
): ReadonlyArray<TransferListId>;

/** Puts `ids` in front of `beforeId`, or after the last visible id. */
export function insertIds(
  selectedIds: ReadonlyArray<TransferListId>,
  visibleIds: ReadonlyArray<TransferListId>,
  ids: ReadonlyArray<TransferListId>,
  beforeId: TransferListId | null,
): TransferListId[];

/** The enabled rows between two indexes, inclusive. */
export function rangeIds(
  rows: ReadonlyArray<TransferListRow>,
  from: number,
  to: number,
): TransferListId[];

/** Id of every enabled row. */
export function enabledIds(
  rows: ReadonlyArray<TransferListRow>,
): TransferListId[];

/** First enabled row index from `index` in the direction of `step`, or -1. */
export function enabledIndexFrom(
  rows: ReadonlyArray<TransferListRow>,
  index: number,
  step: 1 | -1,
): number;

/** The row index a drop at `offsetY` lands in front of. */
export function dropIndex(
  offsetY: number,
  itemHeight: number,
  count: number,
): number;
