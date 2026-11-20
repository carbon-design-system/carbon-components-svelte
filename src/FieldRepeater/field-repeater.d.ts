/**
 * Row identity and list helpers for `FieldRepeater`.
 */

export interface Keyer {
  /**
   * The keys for `items`. With `itemKey` they come from the data; without
   * it they follow the rows `insert`, `remove` and `move` placed.
   */
  sync<T>(
    items: ReadonlyArray<T>,
    itemKey?: (item: T, index: number) => string | number,
  ): string[];
  insert(index: number): void;
  remove(index: number): void;
  move(from: number, to: number): void;
}

/** Create the keys for one list. */
export function createKeyer(): Keyer;

/** A copy of `array` with the element at `from` moved to `to`. */
export function moveInArray<T>(
  array: ReadonlyArray<T>,
  from: number,
  to: number,
): T[];

/** `items` grown to `min` rows with `create`, or `items` itself. */
export function padItems<T>(
  items: T[],
  min: number,
  create: (index: number) => T,
): T[];
