import { allocateCells, layoutCells } from "../../../src/viz/utils/waffle.js";

describe("allocateCells", () => {
  test("hands out every cell, rounding by largest remainder", () => {
    // 33.3, 33.3, 33.3: two floor to 33, the leftover goes to the first.
    expect(allocateCells([1 / 3, 1 / 3, 1 / 3], 100)).toEqual([34, 33, 33]);
    expect(allocateCells([0.525, 0.31, 0.11, 0.04, 0.015], 100)).toEqual([
      52, 31, 11, 4, 2,
    ]);
  });

  test("gives a tiny part one cell rather than none", () => {
    expect(allocateCells([0.996, 0.004], 100)).toEqual([99, 1]);
    expect(allocateCells([0.5, 0.497, 0.003], 100)).toEqual([50, 49, 1]);
  });

  test("gives nothing to a zero share and leaves cells empty under a partial total", () => {
    expect(allocateCells([0.5, 0, 0.25], 100)).toEqual([50, 0, 25]);
    expect(allocateCells([], 100)).toEqual([]);
  });
});

describe("layoutCells", () => {
  test("fills columns from the bottom left, row-major output from the top", () => {
    // 2 rows x 3 columns, counts 3 and 2: part 0 takes column 0 and the
    // bottom of column 1; part 1 takes the top of column 1 and the bottom
    // of column 2; one cell stays empty.
    expect(layoutCells([3, 2], 2, 3)).toEqual([0, 1, -1, 0, 0, 1]);
  });

  test("skips empty parts", () => {
    expect(layoutCells([1, 0, 1], 1, 3)).toEqual([0, 2, -1]);
  });
});
