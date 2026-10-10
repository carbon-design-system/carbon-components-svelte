/**
 * The next filled cell from `[row, column]` in the direction of an arrow
 * key, skipping empty cells. `null` for another key, or when nothing filled
 * lies that way.
 */
export function gridStep(
  key: string,
  from: [number, number],
  size: [number, number],
  filled: (row: number, column: number) => boolean,
): [number, number] | null;
