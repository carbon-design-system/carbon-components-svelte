// @ts-check
// Tile grid layouts: regions as equal squares on a grid, so a map needs no
// geometry, no projection, and no data file.

/**
 * The United States as the widely used tile grid: eleven columns, eight
 * rows, states roughly where they are, every one the same size.
 * @type {ReadonlyArray<import("./tile-grid.d.ts").Tile>}
 */
const US_STATES = [
  ["AK", "Alaska", 0, 0],
  ["ME", "Maine", 0, 10],
  ["VT", "Vermont", 1, 9],
  ["NH", "New Hampshire", 1, 10],
  ["WA", "Washington", 2, 0],
  ["ID", "Idaho", 2, 1],
  ["MT", "Montana", 2, 2],
  ["ND", "North Dakota", 2, 3],
  ["MN", "Minnesota", 2, 4],
  ["IL", "Illinois", 2, 5],
  ["WI", "Wisconsin", 2, 6],
  ["MI", "Michigan", 2, 7],
  ["NY", "New York", 2, 8],
  ["RI", "Rhode Island", 2, 9],
  ["MA", "Massachusetts", 2, 10],
  ["OR", "Oregon", 3, 0],
  ["NV", "Nevada", 3, 1],
  ["WY", "Wyoming", 3, 2],
  ["SD", "South Dakota", 3, 3],
  ["IA", "Iowa", 3, 4],
  ["IN", "Indiana", 3, 5],
  ["OH", "Ohio", 3, 6],
  ["PA", "Pennsylvania", 3, 7],
  ["NJ", "New Jersey", 3, 8],
  ["CT", "Connecticut", 3, 9],
  ["CA", "California", 4, 0],
  ["UT", "Utah", 4, 1],
  ["CO", "Colorado", 4, 2],
  ["NE", "Nebraska", 4, 3],
  ["MO", "Missouri", 4, 4],
  ["KY", "Kentucky", 4, 5],
  ["WV", "West Virginia", 4, 6],
  ["VA", "Virginia", 4, 7],
  ["MD", "Maryland", 4, 8],
  ["DE", "Delaware", 4, 9],
  ["AZ", "Arizona", 5, 1],
  ["NM", "New Mexico", 5, 2],
  ["KS", "Kansas", 5, 3],
  ["AR", "Arkansas", 5, 4],
  ["TN", "Tennessee", 5, 5],
  ["NC", "North Carolina", 5, 6],
  ["SC", "South Carolina", 5, 7],
  ["DC", "District of Columbia", 5, 8],
  ["OK", "Oklahoma", 6, 3],
  ["LA", "Louisiana", 6, 4],
  ["MS", "Mississippi", 6, 5],
  ["AL", "Alabama", 6, 6],
  ["GA", "Georgia", 6, 7],
  ["HI", "Hawaii", 7, 0],
  ["TX", "Texas", 7, 3],
  ["FL", "Florida", 7, 8],
].map(([id, label, row, column]) => ({
  id: String(id),
  label: String(label),
  row: Number(row),
  column: Number(column),
}));

/** @type {Record<import("./tile-grid.d.ts").TileLayout, ReadonlyArray<import("./tile-grid.d.ts").Tile>>} */
export const TILE_LAYOUTS = { "us-states": US_STATES };

/**
 * The tiles of a named layout, or the given tiles, with the grid's size.
 * Tiles are returned sorted by row then column, which is reading order.
 *
 * @param {import("./tile-grid.d.ts").TileLayout | ReadonlyArray<import("./tile-grid.d.ts").Tile>} layout
 * @returns {{ tiles: import("./tile-grid.d.ts").Tile[]; rows: number; columns: number }}
 */
export function resolveTiles(layout) {
  const source = typeof layout === "string" ? TILE_LAYOUTS[layout] : layout;
  const tiles = [...(source ?? [])].sort(
    (a, b) => a.row - b.row || a.column - b.column,
  );
  let rows = 0;
  let columns = 0;
  for (const tile of tiles) {
    rows = Math.max(rows, tile.row + 1);
    columns = Math.max(columns, tile.column + 1);
  }
  return { tiles, rows, columns };
}
