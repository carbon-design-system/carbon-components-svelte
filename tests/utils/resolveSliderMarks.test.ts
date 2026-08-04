import { resolveSliderMarks } from "../../src/utils/resolveSliderMarks.js";

describe("resolveSliderMarks", () => {
  test("returns empty array for falsy marks", () => {
    expect(resolveSliderMarks(false, 0, 100, 1)).toEqual([]);
    expect(resolveSliderMarks(undefined, 0, 100, 1)).toEqual([]);
    expect(resolveSliderMarks(null, 0, 100, 1)).toEqual([]);
  });

  test("generates a tick at every step when marks is true", () => {
    expect(resolveSliderMarks(true, 0, 10, 5)).toEqual([
      { value: 0 },
      { value: 5 },
      { value: 10 },
    ]);
  });

  test("filters array marks to the min/max range", () => {
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

  test("returns empty array when step is not positive in boolean mode", () => {
    expect(resolveSliderMarks(true, 0, 10, 0)).toEqual([]);
    expect(resolveSliderMarks(true, 0, 10, -1)).toEqual([]);
  });
});
