import { buildTree } from "../../../src/viz/TreeChart/tree-geometry.js";

type Row = { id: string; parent: string | null; name: string };

const rows: Row[] = [
  { id: "root", parent: null, name: "Company" },
  { id: "eng", parent: "root", name: "Engineering" },
  { id: "ops", parent: "root", name: "Operations" },
  { id: "web", parent: "eng", name: "Web" },
  { id: "api", parent: "eng", name: "API" },
  { id: "api-core", parent: "api", name: "Core" },
];
const base = {
  id: (row: Row) => row.id,
  parent: (row: Row) => row.parent,
  label: (row: Row) => row.name,
  width: 600,
  height: 300,
};

describe("buildTree", () => {
  test("keeps room for labels on both sides and pads top and bottom", () => {
    const { nodes } = buildTree(rows, base);
    const root = nodes[0];
    const deepest = nodes.find((n) => n.id === "api-core");

    expect(root.x).toBe(96);
    expect(deepest?.x).toBe(600 - 96);
    expect(Math.min(...nodes.map((n) => n.y))).toBe(12);
    expect(Math.max(...nodes.map((n) => n.y))).toBe(300 - 12);
  });

  test("labels nodes and marks which ones have children", () => {
    const { nodes } = buildTree(rows, base);

    expect(nodes.map((n) => [n.label, n.branch, n.childCount])).toEqual([
      ["Company", true, 2],
      ["Engineering", true, 2],
      ["Web", false, 0],
      ["API", true, 1],
      ["Core", false, 0],
      ["Operations", false, 0],
    ]);
  });

  test("folds a collapsed node's descendants away, and gives the rest the room", () => {
    const { nodes, links } = buildTree(rows, { ...base, collapsed: ["eng"] });

    expect(nodes.map((n) => n.id)).toEqual(["root", "eng", "ops"]);
    const eng = nodes[1];
    expect(eng).toMatchObject({ branch: true, collapsed: true, childCount: 2 });
    expect(links.map((l) => l.id)).toEqual(["root/eng", "root/ops"]);
    // Two leaves now, so they take the top and the bottom.
    expect(nodes[1].y).toBe(12);
    expect(nodes[2].y).toBe(288);
  });

  test("moves link paths by the same offsets as the nodes", () => {
    const { nodes, links } = buildTree(rows, base);
    const root = nodes[0];

    expect(links[0].path.startsWith(`M${root.x},${root.y}C`)).toBe(true);
  });

  test("is empty for no rows", () => {
    expect(buildTree([], base)).toEqual({ nodes: [], links: [] });
  });
});
