import { buildArcDiagram } from "../../../src/viz/ArcDiagram/arc-geometry.js";

type Node = { id: string; bundle?: string };
type Link = { from: string; to: string; n?: number };
const nodes: Node[] = [
  { id: "a", bundle: "core" },
  { id: "b", bundle: "ui" },
  { id: "c", bundle: "core" },
  { id: "d", bundle: "ui" },
];
const links: Link[] = [
  { from: "a", to: "b", n: 1 },
  { from: "a", to: "d", n: 5 },
  { from: "c", to: "a", n: 3 },
  { from: "d", to: "x", n: 2 },
];
const options = {
  id: (row: Node) => row.id,
  group: (row: Node) => row.bundle,
  source: (row: Link) => row.from,
  target: (row: Link) => row.to,
  value: (row: Link) => row.n,
  width: 300,
};

describe("buildArcDiagram", () => {
  test("spaces nodes evenly in the given order and draws a semicircle per link, thicker for a larger value", () => {
    const arc = buildArcDiagram(nodes, links, options);
    expect(arc.nodes.map((n) => n.x)).toEqual([0, 100, 200, 300]);
    expect(arc.nodes.map((n) => n.degree)).toEqual([3, 1, 1, 1]);
    // A link to an unknown node is dropped.
    expect(arc.links).toHaveLength(3);
    expect(arc.links[1]).toMatchObject({
      source: "a",
      target: "d",
      backward: false,
      stroke: 8,
    });
    expect(arc.links[1].d).toBe("M0,0A150,150,0,0,1,300,0");
    expect(arc.links[0].stroke).toBe(1);
    expect(arc.above).toBe(150);
    expect(arc.below).toBe(0);
  });

  test("puts a backward link under the line when directed", () => {
    const arc = buildArcDiagram(nodes, links, { ...options, directed: true });
    const back = arc.links[2];
    expect(back).toMatchObject({ source: "c", target: "a", backward: true });
    expect(back.d).toBe("M0,0A100,100,0,0,0,200,0");
    expect(arc.below).toBe(100);
  });

  test("colors nodes and their outgoing links by group, and can order by group or degree", () => {
    const arc = buildArcDiagram(nodes, links, options);
    expect(arc.groups.map((g) => g.key)).toEqual(["core", "ui"]);
    expect(arc.nodes[0].color).toBe(arc.nodes[2].color);
    expect(arc.links[0].color).toBe(arc.nodes[0].color);
    expect(
      buildArcDiagram(nodes, links, { ...options, sort: "group" }).nodes.map(
        (n) => n.key,
      ),
    ).toEqual(["a", "c", "b", "d"]);
    expect(
      buildArcDiagram(nodes, links, { ...options, sort: "degree" }).nodes.map(
        (n) => n.key,
      ),
    ).toEqual(["a", "b", "c", "d"]);
  });

  test("is grayscale without a group and gives every link the same stroke when values match", () => {
    const arc = buildArcDiagram(nodes, links, {
      ...options,
      group: undefined,
      value: undefined,
    });
    expect(arc.groups).toEqual([]);
    expect(arc.nodes[0].color).toBeUndefined();
    expect(new Set(arc.links.map((l) => l.stroke)).size).toBe(1);
  });
});
