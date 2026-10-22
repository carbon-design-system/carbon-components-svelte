/**
 * Tile grid layouts: regions as equal squares, with no geometry.
 */
export type Tile = {
  id: string;
  label: string;
  /** Zero-based row from the top. */
  row: number;
  /** Zero-based column from the left. */
  column: number;
};

export type TileLayout = "us-states";

/** The built-in layouts. */
export const TILE_LAYOUTS: Record<TileLayout, ReadonlyArray<Tile>>;

/**
 * The tiles of a named layout, or the given tiles, in reading order, with
 * the grid's size.
 */
export function resolveTiles(layout: TileLayout | ReadonlyArray<Tile>): {
  tiles: Tile[];
  rows: number;
  columns: number;
};
