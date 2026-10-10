import { pathLine, splitRuns } from "../../../src/viz/utils/path-line.js";

describe("pathLine", () => {
  test("returns an empty string for no points", () => {
    expect(pathLine([])).toBe("");
  });

  test("builds an M/L path through every point", () => {
    expect(
      pathLine([
        { x: 0, y: 10 },
        { x: 50, y: 0 },
        { x: 100, y: 10 },
      ]),
    ).toBe("M0,10L50,0L100,10");
  });

  test("a null point and a non-finite point each start a new subpath", () => {
    expect(
      pathLine([
        { x: 0, y: 0 },
        null,
        { x: 10, y: 10 },
        { x: Number.NaN, y: 1 },
        { x: 20, y: 20 },
      ]),
    ).toBe("M0,0l0,0M10,10l0,0M20,20l0,0");
  });

  test("a lone point becomes a zero-length segment", () => {
    expect(pathLine([{ x: 5, y: 5 }])).toBe("M5,5l0,0");
  });

  test("rounds to the default precision and trims trailing zeros", () => {
    expect(
      pathLine([
        { x: 0, y: 5.128 },
        { x: 1, y: 5.128 },
      ]),
    ).toBe("M0,5.13L1,5.13");
  });

  test("precision: 0 rounds to whole numbers", () => {
    expect(
      pathLine(
        [
          { x: 0, y: 5.6 },
          { x: 1, y: 5.6 },
        ],
        { precision: 0 },
      ),
    ).toBe("M0,6L1,6");
  });

  test("step draws a mid-point riser between each pair", () => {
    expect(
      pathLine(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        { curve: "step" },
      ),
    ).toBe("M0,0H5V10H10");
    expect(
      pathLine(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 0 },
        ],
        { curve: "step" },
      ),
    ).toBe("M0,0H5V10H10H15V0H20");
  });

  test("step-before draws the riser at the start of each segment", () => {
    expect(
      pathLine(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        { curve: "step-before" },
      ),
    ).toBe("M0,0V10H10");
    expect(
      pathLine(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 0 },
        ],
        { curve: "step-before" },
      ),
    ).toBe("M0,0V10H10V0H20");
  });

  test("step-after draws the riser at the end of each segment", () => {
    expect(
      pathLine(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        { curve: "step-after" },
      ),
    ).toBe("M0,0H10V10");
    expect(
      pathLine(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 0 },
        ],
        { curve: "step-after" },
      ),
    ).toBe("M0,0H10V10H20V0");
  });

  test("monotone with fewer than 3 points falls back to a straight segment", () => {
    expect(
      pathLine(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        { curve: "monotone" },
      ),
    ).toBe("M0,0L10,10");
  });

  test("monotone with 3+ points emits C commands", () => {
    const path = pathLine(
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 0 },
      ],
      { curve: "monotone" },
    );
    expect(path).toBe("M0,0C3.33,3.33,6.67,10,10,10C13.33,10,16.67,3.33,20,0");
  });

  test("monotone never overshoots a plateau between neighbors", () => {
    const path = pathLine(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 100 },
        { x: 3, y: 100 },
        { x: 4, y: 20 },
      ],
      { curve: "monotone" },
    );
    const ys = [...path.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map((m) =>
      Number(m[2]),
    );
    expect(ys.length).toBeGreaterThan(0);
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
    }
  });

  test("monotone with two points sharing the same x does not produce NaN", () => {
    const path = pathLine(
      [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 10, y: 10 },
      ],
      { curve: "monotone" },
    );
    expect(path).not.toContain("NaN");
  });
});

describe("splitRuns", () => {
  test("returns runs with correct start indexes", () => {
    expect(
      splitRuns([{ x: 0, y: 0 }, null, { x: 1, y: 1 }, { x: 2, y: 2 }]),
    ).toEqual([
      { start: 0, points: [{ x: 0, y: 0 }] },
      {
        start: 2,
        points: [
          { x: 1, y: 1 },
          { x: 2, y: 2 },
        ],
      },
    ]);
  });
});
