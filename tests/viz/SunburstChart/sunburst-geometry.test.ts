import { buildSunburst } from "../../../src/viz/SunburstChart/sunburst-geometry.js";

type Row = { id: string; parent: string | null; bytes?: number };

const bundle: Row[] = [
  { id: "bundle", parent: null },
  { id: "src", parent: "bundle" },
  { id: "viz", parent: "src", bytes: 400 },
  { id: "core", parent: "src", bytes: 200 },
  { id: "vendor", parent: "bundle", bytes: 400 },
];
const options = {
  id: (row: Row) => row.id,
  parent: (row: Row) => row.parent,
  value: (row: Row) => row.bytes,
  radius: 100,
  innerRadius: 0.2,
  padAngle: 0,
};

describe("buildSunburst", () => {
  test("puts the root at the center and its descendants on rings by depth", () => {
    const sun = buildSunburst(bundle, options);
    expect(sun.center?.id).toBe("bundle");
    expect(sun.total).toBe(1000);
    expect(sun.rings).toBe(2);
    expect(sun.hole).toBe(20);
    expect(sun.arcs.map((arc) => [arc.id, arc.ring])).toEqual([
      ["src", 0],
      ["viz", 1],
      ["core", 1],
      ["vendor", 0],
    ]);
    // src is 60% of the whole: its arc runs from 12 o'clock to past 6.
    expect(sun.arcs[0].share).toBeCloseTo(0.6);
    expect(sun.arcs[0].d).toMatch(/^M/);
    expect(sun.arcs[0].cy).toBeGreaterThan(100);
  });

  test("colors by the branch under the center and lists the branches", () => {
    const sun = buildSunburst(bundle, options);
    const by = Object.fromEntries(sun.arcs.map((arc) => [arc.id, arc]));
    expect(by.viz.color).toBe(by.src.color);
    expect(by.src.color).not.toBe(by.vendor.color);
    expect(sun.groups.map((entry) => entry.label)).toEqual(["src", "vendor"]);
  });

  test("drills to a node, dropping its ancestors, and caps the rings", () => {
    const sun = buildSunburst(bundle, { ...options, root: "src" });
    expect(sun.center?.id).toBe("src");
    expect(sun.center?.parent).toBe("bundle");
    expect(sun.arcs.map((arc) => arc.id)).toEqual(["viz", "core"]);
    expect(sun.arcs[0].share).toBeCloseTo(400 / 600);
    expect(sun.rings).toBe(1);

    const shallow = buildSunburst(bundle, { ...options, maxDepth: 1 });
    expect(shallow.arcs.map((arc) => arc.id)).toEqual(["src", "vendor"]);
  });

  test("shares the first ring among several roots, with no center", () => {
    const sun = buildSunburst(
      [
        { id: "a", parent: null, bytes: 1 },
        { id: "b", parent: null, bytes: 3 },
      ],
      options,
    );
    expect(sun.center).toBeNull();
    expect(sun.arcs.map((arc) => arc.ring)).toEqual([0, 0]);
    expect(sun.arcs[1].share).toBe(0.75);
  });
});
