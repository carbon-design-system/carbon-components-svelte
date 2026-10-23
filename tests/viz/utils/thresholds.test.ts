import {
  crossings,
  normalizeThresholds,
  statusAt,
} from "../../../src/viz/utils/thresholds.js";

describe("normalizeThresholds", () => {
  test("accepts the array form and sorts ascending", () => {
    expect(
      normalizeThresholds([
        { value: 80, kind: "warning" },
        { value: 50, kind: "error" },
      ]),
    ).toEqual([
      { value: 50, kind: "error" },
      { value: 80, kind: "warning" },
    ]);
  });

  test("accepts Meter's { warning, error } object and sorts ascending", () => {
    expect(normalizeThresholds({ warning: 95, error: 80 })).toEqual([
      { value: 80, kind: "error" },
      { value: 95, kind: "warning" },
    ]);
  });

  test("drops non-finite thresholds", () => {
    expect(
      normalizeThresholds([
        { value: Number.NaN, kind: "warning" },
        { value: 10, kind: "error" },
      ]),
    ).toEqual([{ value: 10, kind: "error" }]);
    expect(normalizeThresholds({ warning: Number.NaN, error: 50 })).toEqual([
      { value: 50, kind: "error" },
    ]);
  });

  test("null or undefined returns an empty array", () => {
    expect(normalizeThresholds(null)).toEqual([]);
    expect(normalizeThresholds(undefined)).toEqual([]);
  });
});

describe("statusAt", () => {
  const thresholds = [
    { value: 50, kind: "warning" as const },
    { value: 80, kind: "error" as const },
  ];

  test("below all thresholds is 'default'", () => {
    expect(statusAt(10, thresholds)).toBe("default");
  });

  test("reaching a threshold exactly counts as reached", () => {
    expect(statusAt(50, thresholds)).toBe("warning");
  });

  test("the highest reached threshold wins", () => {
    expect(statusAt(90, thresholds)).toBe("error");
    expect(statusAt(60, thresholds)).toBe("warning");
  });
});

describe("crossings", () => {
  const thresholds = [
    { value: 10, kind: "warning" as const },
    { value: 20, kind: "error" as const },
    { value: 30, kind: "info" as const },
  ];

  test("an upward jump crosses thresholds in ascending order", () => {
    expect(crossings(5, 35, thresholds)).toEqual([
      { threshold: thresholds[0], direction: "above" },
      { threshold: thresholds[1], direction: "above" },
      { threshold: thresholds[2], direction: "above" },
    ]);
  });

  test("a downward jump crosses thresholds in descending order", () => {
    expect(crossings(35, 5, thresholds)).toEqual([
      { threshold: thresholds[2], direction: "below" },
      { threshold: thresholds[1], direction: "below" },
      { threshold: thresholds[0], direction: "below" },
    ]);
  });

  test("reaching a threshold exactly counts as crossing above it", () => {
    expect(crossings(5, 10, thresholds)).toEqual([
      { threshold: thresholds[0], direction: "above" },
    ]);
  });

  test("leaving a threshold exactly counts as crossing below it", () => {
    expect(crossings(10, 5, thresholds)).toEqual([
      { threshold: thresholds[0], direction: "below" },
    ]);
  });

  test("equal prev and next crosses nothing", () => {
    expect(crossings(10, 10, thresholds)).toEqual([]);
  });

  test("a NaN reading crosses nothing", () => {
    expect(crossings(Number.NaN, 10, thresholds)).toEqual([]);
    expect(crossings(10, Number.NaN, thresholds)).toEqual([]);
  });
});
