import { clampIndex } from "../../src/utils/clamp-index.js";

describe("clampIndex", () => {
  it("moves forward and backward within range", () => {
    expect(clampIndex(0, 1, 3)).toBe(1);
    expect(clampIndex(2, -1, 3)).toBe(1);
  });

  it("clamps at the ends instead of wrapping", () => {
    expect(clampIndex(2, 1, 3)).toBe(2);
    expect(clampIndex(0, -1, 3)).toBe(0);
  });

  it("treats -1 as 'nothing selected': step up lands on last, down on first", () => {
    expect(clampIndex(-1, 1, 3)).toBe(0);
    expect(clampIndex(-1, -1, 3)).toBe(2);
  });

  it("returns -1 for an empty range", () => {
    expect(clampIndex(0, 1, 0)).toBe(-1);
    expect(clampIndex(-1, -1, 0)).toBe(-1);
  });
});
