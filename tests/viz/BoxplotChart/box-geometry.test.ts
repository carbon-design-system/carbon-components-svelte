import { buildBoxes } from "../../../src/viz/Chart/box-geometry.js";
import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../../../src/viz/Chart/model.js";

const boxes = [
  {
    x: "api",
    q1: 20,
    median: 30,
    q3: 50,
    whiskerLow: 10,
    whiskerHigh: 80,
    outliers: [95],
  },
  {
    x: "web",
    q1: 40,
    median: 45,
    q3: 60,
    whiskerLow: 30,
    whiskerHigh: 70,
    outliers: [],
  },
  {
    x: "gone",
    q1: 1,
    median: 2,
    q3: 3,
    whiskerLow: 0,
    whiskerHigh: 4,
    outliers: [],
  },
];

function setup(orientation: "vertical" | "horizontal" = "vertical") {
  const built = buildGroups(
    [
      { x: "api", v: 10 },
      { x: "web", v: 100 },
    ],
    { x: (row) => row.x, y: (row) => row.v, series: () => "s" },
  );
  return buildScales(
    resolveDomain(built, {}),
    { width: 440, height: 240 },
    { orientation },
  );
}

describe("buildBoxes", () => {
  test("centers a box on its category and maps every statistic", () => {
    const scales = setup();
    const [api, web] = buildBoxes(boxes, scales);

    expect(api.center).toBeCloseTo(scales.x.map(0));
    expect(web.center).toBeCloseTo(scales.x.map(1));
    expect(api.slot).toBe(0);
    expect(api.median).toBeCloseTo(scales.y.map(30));
    expect(api.boxStart).toBeCloseTo(scales.y.map(50));
    expect(api.boxLength).toBeCloseTo(scales.y.map(20) - scales.y.map(50));
    expect(api.whiskerHigh).toBeLessThan(api.boxStart);
    expect(api.outliers).toEqual([scales.y.map(95)]);
  });

  test("skips a category the scale does not have", () => {
    expect(buildBoxes(boxes, setup()).map((box) => box.key)).toEqual([
      "api",
      "web",
    ]);
  });

  test("caps the width and honors the padding", () => {
    const scales = setup();

    expect(buildBoxes(boxes, scales, { maxBoxWidth: 20 })[0].width).toBe(20);
    expect(
      buildBoxes(boxes, scales, { maxBoxWidth: 1000, padding: 0.5 })[0].width,
    ).toBeCloseTo((scales.step ?? 0) * 0.5);
  });

  test("keeps the same numbers for a horizontal chart, on swapped scales", () => {
    const scales = setup("horizontal");
    const [api] = buildBoxes(boxes, scales);

    // `center` now runs down the plot and the statistics across it.
    expect(api.center).toBeCloseTo(scales.x.map(0));
    expect(api.median).toBeCloseTo(scales.y.map(30));
    expect(api.whiskerHigh).toBeGreaterThan(api.median);
  });

  test("draws nothing without categorical slots", () => {
    const built = buildGroups([{ x: 1, v: 2 }], {
      x: (row) => row.x,
      y: (row) => row.v,
      series: () => "s",
    });
    const scales = buildScales(resolveDomain(built, {}), {
      width: 440,
      height: 240,
    });

    expect(buildBoxes(boxes, scales)).toEqual([]);
  });
});
