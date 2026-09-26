// @vitest-environment node
import {
  nearestMark,
  resolveSliderMarks,
} from "../../src/utils/resolve-slider-marks.js";

describe("resolveSliderMarks", () => {
  it("returns empty array for falsy marks", () => {
    expect(resolveSliderMarks(false, 0, 100, 1)).toEqual([]);
    expect(resolveSliderMarks(undefined, 0, 100, 1)).toEqual([]);
    expect(resolveSliderMarks(null, 0, 100, 1)).toEqual([]);
  });

  it("generates a tick at every step when marks is true", () => {
    expect(resolveSliderMarks(true, 0, 10, 5)).toEqual([
      { value: 0 },
      { value: 5 },
      { value: 10 },
    ]);
  });

  it("filters array marks to the min/max range", () => {
    expect(
      resolveSliderMarks(
        [
          { value: -1, label: "below" },
          { value: 0, label: "Off" },
          { value: 2, label: "Med" },
          { value: 99, label: "above" },
        ],
        0,
        3,
        1,
      ),
    ).toEqual([
      { value: 0, label: "Off" },
      { value: 2, label: "Med" },
    ]);
  });

  it("returns empty array when step is not positive in boolean mode", () => {
    expect(resolveSliderMarks(true, 0, 10, 0)).toEqual([]);
    expect(resolveSliderMarks(true, 0, 10, -1)).toEqual([]);
  });
});

describe("nearestMark", () => {
  it("returns undefined for no marks", () => {
    expect(nearestMark(5, [])).toBeUndefined();
  });

  it("returns the closest mark, including a mark at 0", () => {
    const marks = [{ value: 0 }, { value: 25 }, { value: 100 }];
    expect(nearestMark(3, marks)).toBe(marks[0]);
    expect(nearestMark(27, marks)).toBe(marks[1]);
    expect(nearestMark(80, marks)).toBe(marks[2]);
  });

  it("resolves ties to the earlier mark", () => {
    const marks = [{ value: 0 }, { value: 10 }];
    expect(nearestMark(5, marks)).toBe(marks[0]);
  });
});
