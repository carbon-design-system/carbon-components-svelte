import { buildHive } from "../../../src/viz/HivePlot/hive-geometry.js";

type Node = { id: string; kind: string; load?: number };
type Link = { from: string; to: string };
const nodes: Node[] = [
  { id: "api", kind: "service", load: 80 },
  { id: "worker", kind: "service", load: 20 },
  { id: "pg", kind: "datastore", load: 50 },
  { id: "redis", kind: "datastore", load: 10 },
  { id: "jobs", kind: "queue", load: 30 },
];
const links: Link[] = [
  { from: "api", to: "pg" },
  { from: "api", to: "redis" },
  { from: "worker", to: "jobs" },
  { from: "jobs", to: "worker" },
  { from: "worker", to: "pg" },
  { from: "api", to: "worker" },
];
const options = {
  id: (row: Node) => row.id,
  axis: (row: Node) => row.kind,
  source: (row: Link) => row.from,
  target: (row: Link) => row.to,
  radius: 100,
  innerRadius: 20,
};

describe("buildHive", () => {
  test("spaces one axis per kind around the center, in first-seen order from the top", () => {
    const hive = buildHive(nodes, links, options);
    expect(hive.axes.map((a) => a.key)).toEqual([
      "service",
      "datastore",
      "queue",
    ]);
    expect(hive.axes.map((a) => a.angle)).toEqual([
      0,
      (2 * Math.PI) / 3,
      (4 * Math.PI) / 3,
    ]);
    expect(hive.axes[0]).toMatchObject({
      x1: 0,
      y1: -20,
      x2: 0,
      y2: -100,
      count: 2,
    });
    expect(hive.axes[0].color).not.toBe(hive.axes[1].color);
  });

  test("places nodes along their axis by degree, the most linked farthest out, and colors them by axis", () => {
    const hive = buildHive(nodes, links, options);
    const by = Object.fromEntries(hive.nodes.map((n) => [n.key, n]));
    // api has 3 links, worker 4: worker sits outside api.
    expect(by.worker.degree).toBe(4);
    expect(by.worker.r).toBe(100);
    expect(by.api.r).toBe(20);
    expect(by.pg.r).toBe(100);
    expect(by.jobs.r).toBe(60);
    expect(by.api.color).toBe(hive.axes[0].color);
  });

  test("places nodes by a given position when every node on the axis has one", () => {
    const hive = buildHive(nodes, links, {
      ...options,
      position: (row) => row.load,
    });
    const by = Object.fromEntries(hive.nodes.map((n) => [n.key, n]));
    expect(by.api.r).toBe(100);
    expect(by.worker.r).toBe(20);
    expect(by.api.position).toBe(80);
  });

  test("curves each link toward the center, loops one within an axis, and drops one to an unknown node", () => {
    const hive = buildHive(
      nodes,
      [...links, { from: "api", to: "nope" }],
      options,
    );
    expect(hive.links).toHaveLength(6);
    expect(hive.links[0]).toMatchObject({ source: "api", target: "pg" });
    expect(hive.links[0].d).toMatch(
      /^M[\d.-]+,[\d.-]+Q[\d.-]+,[\d.-]+ [\d.-]+,[\d.-]+$/,
    );
    expect(hive.links[0].color).toBe(hive.axes[0].color);
    // api to worker share the service axis: the control point sits off it.
    const loop = hive.links[5];
    const control = loop.d.match(/Q([\d.-]+),/)?.[1];
    expect(Number(control)).not.toBe(0);
  });

  test("honors a given axis order", () => {
    const hive = buildHive(nodes, links, {
      ...options,
      axes: ["queue", "service", "datastore"],
    });
    expect(hive.axes.map((a) => a.key)).toEqual([
      "queue",
      "service",
      "datastore",
    ]);
    expect(hive.nodes[0].axis).toBe("queue");
  });
});
