import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../../../src/viz/Chart/model.js";
import { buildSwarms } from "../../../src/viz/Chart/swarm-geometry.js";

const swarms = [
  { x: "api", values: [10, 10, 10, 10, 10, 20, null] },
  { x: "web", values: [50] },
  { x: "gone", values: [1] },
];

function setup() {
  const rows = swarms.slice(0, 2).map((s) => ({ x: s.x, value: s.values[0] }));
  const built = buildGroups(rows, {
    x: (row) => row.x,
    y: (row) => row.value,
    series: () => "value",
  });
  const domain = resolveDomain(built, { include: [0, 60], zero: false });
  return buildScales(domain, { width: 300, height: 200 }, {});
}

describe("buildSwarms", () => {
  test("places a dot per finite value, spreading ties across the slot without overlap", () => {
    const shapes = buildSwarms(swarms, setup(), { radius: 4 });
    expect(shapes.map((s) => s.key)).toEqual(["api", "web"]);
    const api = shapes[0];
    expect(api.dots).toHaveLength(6);
    const ties = api.dots.filter((dot) => dot.value === 10);
    expect(new Set(ties.map((dot) => dot.across)).size).toBe(5);
    expect(ties.some((dot) => dot.across === api.center)).toBe(true);
    expect(ties.every((dot) => Math.abs(dot.across - api.center) <= 16)).toBe(
      true,
    );
    expect(api.dots[5].value).toBe(20);
    expect(api.dots[5].along).toBeLessThan(ties[0].along);
  });

  test("squeezes a swarm wider than its slot to fit", () => {
    const many = [
      { x: "api", values: Array.from({ length: 40 }, () => 10) },
      { x: "web", values: [50] },
    ];
    const scales = setup();
    const [api] = buildSwarms(many, scales, { radius: 4, padding: 0.5 });
    const half = ((scales.step ?? 0) * 0.5) / 2;
    for (const dot of api.dots) {
      expect(Math.abs(dot.across - api.center)).toBeLessThanOrEqual(
        half - 4 + 1e-6,
      );
    }
  });
});
