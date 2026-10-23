import { gridStep } from "../../../src/viz/utils/grid-step.js";

// x = filled
//   x . x
//   x x .
const FILLED = [
  [true, false, true],
  [true, true, false],
];
const filled = (r: number, c: number) => FILLED[r][c];
const size: [number, number] = [2, 3];

describe("gridStep", () => {
  test("moves one cell in the direction of the key", () => {
    expect(gridStep("ArrowDown", [0, 0], size, filled)).toEqual([1, 0]);
    expect(gridStep("ArrowRight", [1, 0], size, filled)).toEqual([1, 1]);
    expect(gridStep("ArrowUp", [1, 0], size, filled)).toEqual([0, 0]);
    expect(gridStep("ArrowLeft", [1, 1], size, filled)).toEqual([1, 0]);
  });

  test("skips empty cells", () => {
    expect(gridStep("ArrowRight", [0, 0], size, filled)).toEqual([0, 2]);
  });

  test("is null at an edge, past a trailing gap, or for another key", () => {
    expect(gridStep("ArrowLeft", [0, 0], size, filled)).toBeNull();
    expect(gridStep("ArrowRight", [1, 1], size, filled)).toBeNull();
    expect(gridStep("ArrowUp", [1, 1], size, filled)).toBeNull();
    expect(gridStep("Enter", [0, 0], size, filled)).toBeNull();
  });
});
