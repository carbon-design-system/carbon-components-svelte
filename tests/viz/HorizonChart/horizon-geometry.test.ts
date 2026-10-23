import { buildHorizon } from "../../../src/viz/HorizonChart/horizon-geometry.js";

type Row = { t: number; host: string; cpu: number | null };

const rows: Row[] = [
  { t: 0, host: "a", cpu: 10 },
  { t: 1, host: "a", cpu: 50 },
  { t: 2, host: "a", cpu: 90 },
  { t: 3, host: "a", cpu: null },
  { t: 0, host: "b", cpu: 20 },
  { t: 2, host: "b", cpu: -40 },
  { t: 1, host: "b", cpu: 0 },
];
const options = {
  x: (row: Row) => row.t,
  y: (row: Row) => row.cpu,
  series: (row: Row) => row.host,
  bands: 3,
  max: 90,
  plot: { x0: 0, x1: 300 },
  rowHeight: 30,
};

describe("buildHorizon", () => {
  test("cuts each series into layers of equal value, folded onto the row", () => {
    const horizon = buildHorizon(rows, options);
    expect(horizon.step).toBe(30);
    expect(horizon.domain).toEqual([0, 3]);
    expect(horizon.xs).toEqual([0, 1, 2, 3]);
    const a = horizon.series[0];
    expect(a.key).toBe("a");
    expect(a.xs).toEqual([0, 1, 2, 3]);
    // 10 fills a third of layer 1; 50 fills layer 1 and two thirds of 2;
    // 90 fills all three.
    expect(a.bands.map((band) => band.level)).toEqual([1, 2, 3]);
    expect(a.bands[0].d).toMatch(/^M0,20L100,0L200,0L200,30L0,30Z$/);
    expect(a.bands[1].d).toMatch(/^M0,30L100,10L200,0L200,30L0,30Z$/);
    expect(a.bands[2].d).toMatch(/^M0,30L100,30L200,0L200,30L0,30Z$/);
    expect(a.last).toBeNaN();
    expect(a.min).toBe(10);
    expect(a.max).toBe(90);
  });

  test("darkens each layer along the ramp", () => {
    const horizon = buildHorizon(rows, options);
    const colors = horizon.series[0].bands.map((band) => band.color);
    expect(new Set(colors).size).toBe(3);
    expect(colors[0]).toMatch(/seq-blue/);
  });

  test("folds values below zero into layers of their own hue, sorted by x", () => {
    const horizon = buildHorizon(rows, options);
    const b = horizon.series[1];
    expect(b.xs).toEqual([0, 1, 2]);
    expect(b.bands.map((band) => band.level)).toEqual([1, -1, -2]);
    expect(b.bands[1].color).toMatch(/seq-purple/);
    expect(b.min).toBe(-40);
  });

  test("labels a time axis and reads dates as x", () => {
    const at = (h: number) => new Date(2026, 0, 1, h);
    const dated = [
      { t: at(0), host: "a", cpu: 1 },
      { t: at(12), host: "a", cpu: 2 },
    ];
    const horizon = buildHorizon(dated, {
      x: (row) => row.t,
      y: (row) => row.cpu,
      series: (row) => row.host,
      bands: 3,
      plot: { x0: 0, x1: 300 },
      rowHeight: 30,
      locale: "en-US",
    });
    expect(horizon.ticks.length).toBeGreaterThan(1);
    expect(horizon.ticks[0].label).toMatch(/AM|PM/);
    expect(horizon.xLabel(at(12).getTime())).toMatch(/Jan 1, 2026/);
    expect(horizon.top).toBe(2);
  });
});
