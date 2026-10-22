import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../../../src/viz/Chart/model.js";
import { buildWaterfall } from "../../../src/viz/Chart/waterfall-geometry.js";

type Row = { step: string; change: number | null };

const rows: Row[] = [
  { step: "Start", change: 100 },
  { step: "Sales", change: 60 },
  { step: "Refunds", change: -30 },
  { step: "Q1", change: 0 },
  { step: "Costs", change: -50 },
  { step: "Missing", change: null },
  { step: "End", change: 0 },
];

function setup(
  include: number[] = [],
  orientation: "vertical" | "horizontal" = "vertical",
) {
  const built = buildGroups(rows, {
    x: (row) => row.step,
    y: (row) => row.change,
    series: () => "s",
  });
  const scales = buildScales(
    resolveDomain(built, { include }),
    { width: 640, height: 300 },
    { orientation },
  );
  return { groups: built.groups, scales };
}

describe("buildWaterfall", () => {
  test("floats each bar from the running total before it to the one after", () => {
    const { groups, scales } = setup();
    const { bars } = buildWaterfall(groups, scales, { totals: ["Q1", "End"] });

    expect(bars.map((bar) => [bar.kind, bar.from, bar.to])).toEqual([
      ["increase", 0, 100],
      ["increase", 100, 160],
      ["decrease", 160, 130],
      ["total", 0, 130],
      ["decrease", 130, 80],
      ["total", 0, 80],
    ]);
    // A subtotal reports the running total, not its own value.
    expect(bars[3].value).toBe(130);
    expect(bars[2].value).toBe(-30);
  });

  test("maps the floats onto the y scale, clamped to the plot", () => {
    const { groups, scales } = setup([0, 160]);
    const { bars } = buildWaterfall(groups, scales);
    const [start, sales] = bars;

    expect(start.y + start.height).toBeCloseTo(scales.y.map(0));
    expect(sales.y).toBeCloseTo(scales.y.map(160));
    expect(sales.y + sales.height).toBeCloseTo(scales.y.map(100));
  });

  test("joins each bar's end to the next bar's start", () => {
    const { groups, scales } = setup([0, 160]);
    const { bars, connectors } = buildWaterfall(groups, scales);

    expect(connectors).toHaveLength(bars.length - 1);
    const [first] = connectors;
    expect(first.x1).toBeCloseTo(bars[0].x + bars[0].width);
    expect(first.x2).toBeCloseTo(bars[1].x);
    expect(first.y1).toBeCloseTo(scales.y.map(100));
    expect(first.y1).toBe(first.y2);
  });

  test("aims the connector into a subtotal at the total, not at zero", () => {
    const { groups, scales } = setup([0, 160]);
    const { connectors } = buildWaterfall(groups, scales, { totals: ["Q1"] });

    // Refunds ends at 130, and Q1 rises to 130.
    expect(connectors[2].y1).toBeCloseTo(scales.y.map(130));
  });

  test("reports the extent the running total reaches", () => {
    const { groups, scales } = setup();

    expect(buildWaterfall(groups, scales).extent).toEqual([0, 160]);
    const negative = buildGroups(
      [
        { step: "a", change: -40 },
        { step: "b", change: 10 },
      ],
      { x: (row) => row.step, y: (row) => row.change, series: () => "s" },
    );
    expect(buildWaterfall(negative.groups, scales).extent).toEqual([-40, 0]);
  });

  test("lies on its side in a horizontal chart", () => {
    const { groups, scales } = setup([0, 160], "horizontal");
    const { bars, connectors } = buildWaterfall(groups, scales);

    expect(bars[0].x).toBeCloseTo(scales.y.map(0));
    expect(bars[1].x + bars[1].width).toBeCloseTo(scales.y.map(160));
    expect(bars[1].y).toBeGreaterThan(bars[0].y);
    expect(connectors[0].x1).toBe(connectors[0].x2);
  });

  test("draws nothing without a visible series or slots", () => {
    const { groups, scales } = setup();

    expect(
      buildWaterfall([{ ...groups[0], hidden: true }], scales).bars,
    ).toEqual([]);
    expect(buildWaterfall([], scales).extent).toBeNull();
  });
});
