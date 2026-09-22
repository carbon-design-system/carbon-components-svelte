import {
  resolveTiles,
  TILE_LAYOUTS,
} from "../../../src/viz/utils/tile-grid.js";

describe("resolveTiles", () => {
  test("the US layout has every state and DC, each on its own cell", () => {
    const { tiles, rows, columns } = resolveTiles("us-states");
    expect(tiles).toHaveLength(51);
    expect(rows).toBe(8);
    expect(columns).toBe(11);
    const cells = new Set(tiles.map((tile) => `${tile.row}:${tile.column}`));
    expect(cells.size).toBe(51);
    expect(new Set(tiles.map((tile) => tile.id)).size).toBe(51);
  });

  test("returns tiles in reading order", () => {
    const { tiles } = resolveTiles("us-states");
    expect(tiles.slice(0, 4).map((tile) => tile.id)).toEqual([
      "AK",
      "ME",
      "VT",
      "NH",
    ]);
    expect(tiles.at(-1)?.id).toBe("FL");
  });

  test("accepts custom tiles and sizes the grid to them", () => {
    const { tiles, rows, columns } = resolveTiles([
      { id: "b", label: "B", row: 1, column: 2 },
      { id: "a", label: "A", row: 0, column: 0 },
    ]);
    expect(tiles.map((tile) => tile.id)).toEqual(["a", "b"]);
    expect(rows).toBe(2);
    expect(columns).toBe(3);
    expect(TILE_LAYOUTS["us-states"]).toHaveLength(51);
  });
});
