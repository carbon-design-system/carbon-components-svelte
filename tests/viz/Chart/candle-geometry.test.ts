import { buildCandles } from "../../../src/viz/Chart/candle-geometry.js";
import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../../../src/viz/Chart/model.js";

const candles = [
  { x: "Mon", open: 10, high: 15, low: 8, close: 14 },
  { x: "Tue", open: 14, high: 16, low: 9, close: 10 },
  { x: "Wed", open: 10, high: 12, low: 9, close: 10 },
  { x: "Sun", open: 1, high: 2, low: 0, close: 1 },
];

function setup(orientation: "vertical" | "horizontal" = "vertical") {
  const rows = candles
    .filter((c) => c.x !== "Sun")
    .flatMap((c) => [
      { x: c.x, price: "open", value: c.open },
      { x: c.x, price: "close", value: c.close },
    ]);
  const built = buildGroups(rows, {
    x: (row) => row.x,
    y: (row) => row.value,
    series: (row) => row.price,
  });
  const domain = resolveDomain(built, { include: [8, 16], zero: false });
  return buildScales(domain, { width: 300, height: 200 }, { orientation });
}

describe("buildCandles", () => {
  test("draws a candle per category with a body from open to close and a wick from low to high", () => {
    const shapes = buildCandles(candles, setup());
    // Sunday is not on the scale.
    expect(shapes.map((s) => s.key)).toEqual(["Mon", "Tue", "Wed"]);
    const mon = shapes[0];
    expect(mon).toMatchObject({ slot: 0, up: true, down: false, change: 4 });
    expect(mon.wickHigh).toBeLessThan(mon.bodyStart);
    expect(mon.bodyStart + mon.bodyLength).toBeLessThan(mon.wickLow);
    expect(shapes[1]).toMatchObject({ up: false, down: true, change: -4 });
    // A flat candle keeps a hairline body.
    expect(shapes[2]).toMatchObject({ up: false, down: false, bodyLength: 1 });
  });

  test("caps the body width and keeps it inside the slot", () => {
    const scales = setup();
    expect(buildCandles(candles, scales)[0].width).toBe(24);
    expect(
      buildCandles(candles, scales, { maxBodyWidth: 100, padding: 0.5 })[0]
        .width,
    ).toBeCloseTo((scales.step ?? 0) * 0.5);
  });

  test("runs along the other axis when the chart is horizontal", () => {
    const shapes = buildCandles(candles, setup("horizontal"));
    expect(shapes[0].wickHigh).toBeGreaterThan(shapes[0].wickLow);
  });
});
