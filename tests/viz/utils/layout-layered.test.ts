import { layoutLayered } from "../../../src/viz/utils/layout-layered.js";

const nodes = ["app", "api", "web", "db", "auth"].map((id) => ({ id }));
const edges = [
  { source: "app", target: "api" },
  { source: "app", target: "web" },
  { source: "api", target: "db" },
  { source: "api", target: "auth" },
  { source: "web", target: "auth" },
];
const by = <T>(layout: { nodes: Array<{ id: string } & T> }) =>
  Object.fromEntries(layout.nodes.map((node) => [node.id, node]));

describe("layoutLayered", () => {
  test("ranks by longest path and lays ranks down the page", () => {
    const layout = layoutLayered(nodes, edges, {
      nodeWidth: 100,
      nodeHeight: 30,
      rankGap: 20,
      nodeGap: 20,
    });
    const at = by(layout);
    expect([
      at.app.rank,
      at.api.rank,
      at.web.rank,
      at.db.rank,
      at.auth.rank,
    ]).toEqual([0, 1, 1, 2, 2]);
    expect(at.app.y).toBe(0);
    expect(at.api.y).toBe(50);
    expect(at.db.y).toBe(100);
    expect(layout.ranks).toBe(3);
    expect(layout.height).toBe(130);
    // Nodes in one rank never overlap.
    expect(Math.abs(at.api.x - at.web.x)).toBeGreaterThanOrEqual(120);
    expect(layout.nodes.map((node) => node.id)).toEqual([
      "app",
      "api",
      "web",
      "db",
      "auth",
    ]);
  });

  test("routes every edge from the source's bottom to the target's top", () => {
    const layout = layoutLayered(nodes, edges, {
      nodeWidth: 100,
      nodeHeight: 30,
      rankGap: 20,
    });
    const at = by(layout);
    const edge = layout.edges.find((entry) => entry.id === "app->api");
    expect(edge?.points[0]).toEqual({ x: at.app.x + 50, y: 30 });
    expect(edge?.points.at(-1)).toEqual({ x: at.api.x + 50, y: 50 });
    expect(edge?.reversed).toBe(false);
  });

  test("keeps a long edge close to what it joins instead of pushing it aside", () => {
    const layout = layoutLayered(
      [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
      [
        { source: "a", target: "b" },
        { source: "a", target: "c" },
        { source: "b", target: "d" },
        { source: "c", target: "d" },
        { source: "a", target: "d" },
      ],
      { nodeWidth: 100, nodeHeight: 30, rankGap: 20, nodeGap: 20 },
    );
    const at = by(layout);
    const long = layout.edges.find((entry) => entry.id === "a->d");
    const bend = long?.points[1].x ?? 0;
    expect(bend).toBeGreaterThanOrEqual(Math.min(at.b.x, at.c.x));
    expect(bend).toBeLessThanOrEqual(Math.max(at.b.x, at.c.x) + 130);
    expect(layout.width).toBeLessThan(400);
  });

  test("passes a long edge through the ranks it skips", () => {
    const layout = layoutLayered(
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      [
        { source: "a", target: "b" },
        { source: "b", target: "c" },
        { source: "a", target: "c" },
      ],
      { nodeWidth: 100, nodeHeight: 30, rankGap: 20 },
    );
    const long = layout.edges.find((entry) => entry.id === "a->c");
    expect(long?.points).toHaveLength(3);
    expect(long?.points[1].y).toBe(65);
  });

  test("cuts a cycle by reversing the edge that closes it", () => {
    const layout = layoutLayered(
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      [
        { source: "a", target: "b" },
        { source: "b", target: "c" },
        { source: "c", target: "a" },
      ],
    );
    const at = by(layout);
    expect([at.a.rank, at.b.rank, at.c.rank]).toEqual([0, 1, 2]);
    const back = layout.edges.find((entry) => entry.id === "c->a");
    expect(back?.reversed).toBe(true);
    // Drawn from c back up to a.
    expect(back?.points[0].y).toBeGreaterThan(back?.points.at(-1)?.y ?? 0);
  });

  test("folds away what is reachable only through a collapsed node, and counts it", () => {
    const layout = layoutLayered(nodes, edges, { collapsed: ["api"] });
    expect(layout.nodes.map((node) => node.id).sort()).toEqual([
      "api",
      "app",
      "auth",
      "web",
    ]);
    const api = layout.nodes.find((node) => node.id === "api");
    expect(api?.collapsed).toBe(true);
    // db is only reachable through api; auth is also reachable through web.
    expect(api?.hidden).toBe(1);
    expect(api?.children).toBe(2);
    expect(layout.edges.some((entry) => entry.target === "db")).toBe(false);
  });

  test("folds along the cycle-free edges, so a back edge cannot keep a node alive", () => {
    const layout = layoutLayered(
      nodes,
      [...edges, { source: "auth", target: "app" }],
      {
        collapsed: ["api"],
      },
    );
    expect(layout.nodes.map((node) => node.id).sort()).toEqual([
      "api",
      "app",
      "auth",
      "web",
    ]);
    expect(layout.nodes.find((node) => node.id === "api")?.hidden).toBe(1);
  });

  test("keeps nodes of a lane in one band, in lane order", () => {
    const layout = layoutLayered(
      [
        { id: "app", lane: "edge" },
        { id: "api", lane: "services" },
        { id: "web", lane: "edge" },
        { id: "db", lane: "data" },
        { id: "auth", lane: "services" },
      ],
      edges,
      { lanes: ["edge", "services", "data"], nodeWidth: 100, nodeGap: 20 },
    );
    expect(layout.lanes.map((lane) => lane.key)).toEqual([
      "edge",
      "services",
      "data",
    ]);
    const at = by(layout);
    const [edge, services, data] = layout.lanes;
    for (const id of ["app", "web"]) {
      expect(at[id].x).toBeGreaterThanOrEqual(edge.x0);
      expect(at[id].x + at[id].width).toBeLessThanOrEqual(edge.x1);
    }
    for (const id of ["api", "auth"]) {
      expect(at[id].x).toBeGreaterThanOrEqual(services.x0);
      expect(at[id].x + at[id].width).toBeLessThanOrEqual(services.x1);
    }
    expect(at.db.x).toBeGreaterThanOrEqual(data.x0);
    expect(edge.x1).toBeLessThan(services.x0);
    expect(services.x1).toBeLessThan(data.x0);
  });

  test("runs left to right when asked, swapping the axes", () => {
    const layout = layoutLayered(nodes, edges, {
      rankDir: "LR",
      nodeWidth: 100,
      nodeHeight: 30,
      rankGap: 20,
    });
    const at = by(layout);
    expect(at.app.x).toBe(0);
    expect(at.api.x).toBe(120);
    expect(at.app.width).toBe(100);
    expect(at.app.height).toBe(30);
    expect(layout.width).toBe(340);
    expect(Math.abs(at.api.y - at.web.y)).toBeGreaterThanOrEqual(30);
  });

  test("drops self loops, unknown ends, and duplicate edges, and orders to reduce crossings", () => {
    const layout = layoutLayered(
      [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
      [
        { source: "a", target: "d" },
        { source: "b", target: "c" },
        { source: "a", target: "a" },
        { source: "a", target: "ghost" },
        { source: "b", target: "c" },
      ],
      { nodeWidth: 100, nodeGap: 20 },
    );
    expect(layout.edges).toHaveLength(2);
    const at = by(layout);
    // a is left of b, so d should be left of c after the sweeps.
    expect(at.a.x < at.b.x).toBe(at.d.x < at.c.x);
  });
});
