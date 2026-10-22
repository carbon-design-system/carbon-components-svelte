import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../../../src/viz/Chart/model.js";
import { buildViolins } from "../../../src/viz/Chart/violin-geometry.js";

const violins = [
  {
    x: "api",
    values: [10, 12, 12, 13, 14, 15, 15, 16, 18],
    q1: 12,
    median: 14,
    q3: 15,
  },
  { x: "web", values: [100, 110, 120], q1: 105, median: 110, q3: 115 },
  { x: "gone", values: [], q1: 0, median: 0, q3: 0 },
];

function setup(orientation: "vertical" | "horizontal" = "vertical") {
  const rows = violins.slice(0, 2).flatMap((v) => [
    { x: v.x, stat: "q1", value: v.q1 },
    { x: v.x, stat: "q3", value: v.q3 },
  ]);
  const built = buildGroups(rows, {
    x: (row) => row.x,
    y: (row) => row.value,
    series: (row) => row.stat,
  });
  const domain = resolveDomain(built, { include: [0, 130], zero: false });
  return buildScales(domain, { width: 300, height: 200 }, { orientation });
}

describe("buildViolins", () => {
  test("draws a closed, mirrored outline per category on the scale, with the quartiles placed", () => {
    const shapes = buildViolins(violins, setup(), { points: 8 });
    expect(shapes.map((s) => s.key)).toEqual(["api", "web"]);
    const api = shapes[0];
    expect(api.d).toMatch(/^M.*Z$/);
    // Eight points up one side and eight back down the other.
    expect(api.d.split("L")).toHaveLength(16);
    expect(api.q3).toBeLessThan(api.median);
    expect(api.median).toBeLessThan(api.q1);
    // The tails sit past the quartiles: the largest value's end above q3.
    expect(api.end).toBeLessThan(api.q3);
    expect(api.start).toBeGreaterThan(api.q1);
    expect(api.count).toBe(9);
    expect(api.bandwidth).toBeGreaterThan(0);
  });

  test("gives every violin the same peak width, capped and inside the slot", () => {
    const scales = setup();
    const [api, web] = buildViolins(violins, scales, { points: 8 });
    const widest = (d: string) => {
      const xs =
        d.match(/[ML]([\d.]+),/g)?.map((m) => Number(m.slice(1, -1))) ?? [];
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(widest(api.d)).toBeCloseTo(api.width, 0);
    expect(widest(web.d)).toBeCloseTo(web.width, 0);
    expect(api.width).toBeLessThanOrEqual(96);
    expect(buildViolins(violins, scales, { maxWidth: 20 })[0].width).toBe(20);
  });

  test("runs along the other axis when the chart is horizontal", () => {
    const shapes = buildViolins(violins, setup("horizontal"), { points: 8 });
    expect(shapes[0].q3).toBeGreaterThan(shapes[0].q1);
  });
});
