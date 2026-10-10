/**
 * Waffle math: exact cell counts for parts of a whole, and their layout.
 */

/**
 * How many of `count` cells each share gets, by largest remainder, so the
 * counts sum to `count`. A share above zero gets at least one cell when
 * one can be spared.
 */
export function allocateCells(
  shares: ReadonlyArray<number>,
  count: number,
): number[];

/**
 * The grid row by row from the top: the part index of each cell, or `-1`
 * for an empty one. Cells fill column by column from the bottom left.
 */
export function layoutCells(
  counts: ReadonlyArray<number>,
  rows: number,
  columns: number,
): number[];
