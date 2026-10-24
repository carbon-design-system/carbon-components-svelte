import {
  axisSegments,
  boxes,
  crossCenter,
  distanceSegments,
  failingTargets,
  mergeLabels,
  ringLabels,
  rowDelta,
} from "../../src/devtools/geometry.js";

const box = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  width,
  height,
});

describe("rowDelta", () => {
  test("is null without rows", () => {
    expect(rowDelta(10, 0, 0)).toBeNull();
  });

  test("is the signed distance to the nearest row", () => {
    expect(rowDelta(16, 8, 0)).toBe(0);
    expect(rowDelta(18, 8, 0)).toBe(2);
    expect(rowDelta(22, 8, 0)).toBe(-2);
  });

  test("counts rows from the offset", () => {
    expect(rowDelta(50, 8, 48)).toBe(2);
    expect(rowDelta(46, 8, 48)).toBe(-2);
  });

  test("rounds to 0.1px", () => {
    expect(rowDelta(16.333, 8, 0)).toBe(0.3);
  });
});

describe("boxes", () => {
  test("derives the margin, padding, and content boxes", () => {
    const result = boxes(
      box(100, 100, 200, 100),
      [8, 8, 8, 8],
      [1, 1, 1, 1],
      [16, 16, 16, 16],
    );
    expect(result.marginBox).toEqual(box(92, 92, 216, 116));
    expect(result.paddingBox).toEqual(box(101, 101, 198, 98));
    expect(result.contentBox).toEqual(box(117, 117, 166, 66));
  });

  test("draws negative margins as zero", () => {
    const result = boxes(
      box(0, 0, 10, 10),
      [-4, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    );
    expect(result.marginWidths).toEqual([0, 0, 0, 0]);
    expect(result.marginBox).toEqual(box(0, 0, 10, 10));
  });
});

describe("ringLabels", () => {
  test("centers a label in each non-zero side", () => {
    const labels = ringLabels(
      box(0, 0, 100, 100),
      box(10, 20, 80, 60),
      [20, 10, 0, 10],
    );
    expect(labels).toEqual([
      { side: "top", value: 20, x: 50, y: 10 },
      { side: "right", value: 10, x: 95, y: 50 },
      { side: "left", value: 10, x: 5, y: 50 },
    ]);
  });
});

describe("axisSegments", () => {
  test("spans the gap between separate ranges", () => {
    expect(axisSegments(0, 10, 30, 40)).toEqual([[10, 30]]);
    expect(axisSegments(30, 40, 0, 10)).toEqual([[10, 30]]);
  });

  test("spans each differing edge of nested ranges", () => {
    expect(axisSegments(0, 100, 10, 80)).toEqual([
      [0, 10],
      [80, 100],
    ]);
  });

  test("skips edges that line up", () => {
    expect(axisSegments(0, 100, 0, 80)).toEqual([[80, 100]]);
  });
});

describe("crossCenter", () => {
  test("uses the middle of the overlap", () => {
    expect(crossCenter(0, 100, 50, 150)).toBe(75);
  });

  test("falls back to the middle of the first range", () => {
    expect(crossCenter(0, 100, 200, 300)).toBe(50);
  });
});

describe("distanceSegments", () => {
  test("measures a horizontal gap at the shared height", () => {
    const a = { left: 0, right: 100, top: 0, bottom: 40 };
    const b = { left: 124, right: 200, top: 0, bottom: 40 };
    expect(distanceSegments(a, b)).toEqual([
      { x1: 100, x2: 124, y1: 20, y2: 20, value: 24 },
    ]);
  });
});

describe("failingTargets", () => {
  test("passes targets at least the minimum size", () => {
    expect(failingTargets([box(0, 0, 24, 24), box(24, 0, 24, 24)], 24)).toEqual(
      [],
    );
  });

  test("passes a small target with room around it", () => {
    expect(
      failingTargets([box(0, 0, 16, 16), box(100, 0, 40, 40)], 24),
    ).toEqual([]);
  });

  test("fails a small target next to another target", () => {
    // Center at 8, radius 12: the circle reaches x = 20, past the other
    // target's edge at 18.
    expect(failingTargets([box(0, 0, 16, 16), box(18, 0, 40, 40)], 24)).toEqual(
      [0],
    );
  });

  test("fails two small targets whose circles overlap", () => {
    // Centers 20px apart, under the 24px diameter.
    expect(failingTargets([box(0, 0, 16, 16), box(20, 0, 16, 16)], 24)).toEqual(
      [0, 1],
    );
  });

  test("passes small targets spaced a full diameter apart", () => {
    // A 20px checkbox row every 32px, like a Carbon checkbox list.
    const list = [0, 32, 64].map((top) => box(0, top, 20, 20));
    expect(failingTargets(list, 24)).toEqual([]);
  });

  test("treats nested targets as one", () => {
    expect(failingTargets([box(0, 0, 16, 16), box(2, 2, 12, 12)], 24)).toEqual(
      [],
    );
  });
});

describe("failingTargets layers", () => {
  test("does not let a fixed header crowd the page below it", () => {
    const radio = box(100, 20, 52, 22);
    const headerLink = box(0, 0, 120, 47);
    expect(failingTargets([radio, headerLink], 24)).toEqual([0]);
    expect(failingTargets([radio, headerLink], 24, ["page", "header"])).toEqual(
      [],
    );
  });
});

describe("mergeLabels", () => {
  const mark = (x: number, y: number, text = "16 × 16", group = "targets") => ({
    x,
    y,
    text,
    group,
  });

  test("keeps labels that do not collide", () => {
    expect(mergeLabels([mark(0, 0), mark(200, 0), mark(0, 100)])).toEqual([
      "16 × 16",
      "16 × 16",
      "16 × 16",
    ]);
  });

  test("merges a row of crowded labels onto the first", () => {
    expect(mergeLabels([mark(40, 0), mark(0, 0), mark(20, 0)])).toEqual([
      null,
      "16 × 16 · +2 more",
      null,
    ]);
  });

  test("keeps groups apart", () => {
    expect(
      mergeLabels([mark(0, 0), mark(20, 0, "1.9:1 · needs 4.5:1", "contrast")]),
    ).toEqual(["16 × 16", "1.9:1 · needs 4.5:1"]);
  });

  test("makes room for the longer merged label", () => {
    // Clear of "16 × 16" alone, but not of "16 × 16 · +1 more".
    expect(mergeLabels([mark(0, 0), mark(20, 0), mark(100, 0)])).toEqual([
      "16 × 16 · +2 more",
      null,
      null,
    ]);
  });
});
