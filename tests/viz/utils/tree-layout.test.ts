import { treeLayout } from "../../../src/viz/utils/tree-layout.js";

type Row = { id: string; parent: string | null };

const rows: Row[] = [
  { id: "root", parent: null },
  { id: "a", parent: "root" },
  { id: "b", parent: "root" },
  { id: "a1", parent: "a" },
  { id: "a2", parent: "a" },
  { id: "b1", parent: "b" },
];
const base = {
  id: (row: Row) => row.id,
  parent: (row: Row) => row.parent,
  width: 200,
  height: 100,
};

describe("treeLayout", () => {
  test("puts depth across and spreads leaves down, parents centered", () => {
    const { nodes, depth, leaves } = treeLayout(rows, base);
    const at = Object.fromEntries(nodes.map((n) => [n.id, [n.x, n.y]]));

    expect(depth).toBe(2);
    expect(leaves).toBe(3);
    expect(at).toEqual({
      root: [0, 62.5],
      a: [100, 25],
      a1: [200, 0],
      a2: [200, 50],
      b: [100, 100],
      b1: [200, 100],
    });
  });

  test("lists nodes depth first and links each child to its parent", () => {
    const { nodes, links } = treeLayout(rows, base);

    expect(nodes.map((n) => n.id)).toEqual([
      "root",
      "a",
      "a1",
      "a2",
      "b",
      "b1",
    ]);
    expect(links.map((l) => `${l.source.id}>${l.target.id}`)).toEqual([
      "root>a",
      "a>a1",
      "a>a2",
      "root>b",
      "b>b1",
    ]);
    expect(links[0].path).toBe("M0,62.5C50,62.5,50,25,100,25");
  });

  test("moves every leaf to the last column for a dendrogram", () => {
    const { nodes } = treeLayout([...rows, { id: "c", parent: "root" }], {
      ...base,
      align: "leaves",
    });
    const c = nodes.find((n) => n.id === "c");

    expect(c?.depth).toBe(1);
    expect(c?.x).toBe(200);
  });

  test("treats a missing parent as a root, and lays several roots out in turn", () => {
    const { nodes } = treeLayout(
      [
        { id: "x", parent: "ghost" },
        { id: "y", parent: null },
        { id: "y1", parent: "y" },
      ],
      base,
    );

    expect(nodes.filter((n) => n.parent === null).map((n) => n.id)).toEqual([
      "x",
      "y",
    ]);
    expect(nodes.find((n) => n.id === "x")?.y).toBe(0);
    expect(nodes.find((n) => n.id === "y1")?.y).toBe(100);
  });

  test("breaks a cycle instead of looping, and keeps the first of a repeated id", () => {
    const { nodes } = treeLayout(
      [
        { id: "a", parent: "b" },
        { id: "b", parent: "a" },
        { id: "a", parent: null },
      ],
      base,
    );

    expect(nodes).toHaveLength(2);
    expect(nodes.filter((n) => n.parent === null)).toHaveLength(1);
  });

  test("survives a very deep chain and nothing at all", () => {
    const chain = Array.from({ length: 20000 }, (_, i) => ({
      id: String(i),
      parent: i === 0 ? null : String(i - 1),
    }));

    expect(treeLayout(chain, base).depth).toBe(19999);
    expect(treeLayout([], base)).toEqual({
      nodes: [],
      links: [],
      depth: 0,
      leaves: 0,
    });
  });
});
