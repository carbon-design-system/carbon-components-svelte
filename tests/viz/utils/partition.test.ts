import { partition } from "../../../src/viz/utils/partition.js";

type Row = { id: string; parent: string | null; bytes?: number };

const bundle: Row[] = [
  { id: "bundle", parent: null },
  { id: "src", parent: "bundle" },
  { id: "viz", parent: "src", bytes: 410 },
  { id: "core", parent: "src", bytes: 230 },
  { id: "vendor", parent: "bundle", bytes: 380 },
  { id: "assets", parent: "bundle", bytes: 200 },
  { id: "css", parent: "assets", bytes: 60 },
  { id: "img", parent: "assets", bytes: 120 },
];
const options = {
  id: (row: Row) => row.id,
  parent: (row: Row) => row.parent,
  value: (row: Row) => row.bytes,
};

describe("partition", () => {
  test("rolls values up and slices children inside their parent, in input order", () => {
    const tree = partition(bundle, options);
    expect(tree.total).toBe(1220);
    expect(tree.depth).toBe(2);
    const by = Object.fromEntries(tree.nodes.map((node) => [node.id, node]));
    expect(by.src.value).toBe(640);
    expect(by.assets.value).toBe(200);
    expect(by.assets.own).toBe(20);
    expect(by.src.x0).toBe(0);
    expect(by.src.x1).toBeCloseTo((640 / 1220) * 100);
    expect(by.vendor.x0).toBeCloseTo(by.src.x1);
    expect(by.viz.x1).toBeCloseTo((410 / 1220) * 100);
    expect(by.viz.depth).toBe(2);
    expect(by.viz.share).toBeCloseTo(410 / 1220);
    expect(tree.nodes.map((node) => node.id)).toEqual([
      "bundle",
      "src",
      "viz",
      "core",
      "vendor",
      "assets",
      "css",
      "img",
    ]);
  });

  test("sorts children largest first when asked", () => {
    const tree = partition(bundle, { ...options, sort: "value" });
    expect(
      tree.nodes
        .filter((node) => node.parent === "bundle")
        .map((node) => node.id),
    ).toEqual(["src", "vendor", "assets"]);
    expect(
      tree.nodes
        .filter((node) => node.parent === "assets")
        .map((node) => node.id),
    ).toEqual(["img", "css"]);
  });

  test("scopes to a root, keeping its ancestors as full-width steps", () => {
    const tree = partition(bundle, { ...options, root: "src" });
    expect(tree.total).toBe(640);
    expect(tree.ancestors).toBe(1);
    expect(tree.nodes.map((node) => `${node.depth}:${node.id}`)).toEqual([
      "0:bundle",
      "1:src",
      "2:viz",
      "2:core",
    ]);
    expect(tree.nodes[0].ancestor).toBe(true);
    expect(tree.nodes[0].x1).toBe(100);
    expect(tree.nodes[1].x1).toBe(100);
    expect(tree.nodes[2].x1).toBeCloseTo((410 / 640) * 100);
  });

  test("caps the depth and treats a cycle or an unknown parent as a root", () => {
    const shallow = partition(bundle, { ...options, maxDepth: 2 });
    expect(shallow.depth).toBe(1);
    expect(shallow.nodes.some((node) => node.id === "viz")).toBe(false);

    const loop = partition(
      [
        { id: "a", parent: "b", bytes: 1 },
        { id: "b", parent: "a", bytes: 1 },
        { id: "c", parent: "ghost", bytes: 2 },
      ],
      options,
    );
    // The row that would close the loop becomes a root.
    expect(
      loop.nodes.filter((node) => node.parent === null).map((node) => node.id),
    ).toEqual(["b", "c"]);
    expect(loop.total).toBe(3);
  });

  test("leaves a parent's own value empty at the end of its span", () => {
    const tree = partition(
      [
        { id: "main", parent: null, bytes: 100 },
        { id: "render", parent: "main", bytes: 60 },
        { id: "fetch", parent: "main", bytes: 30 },
      ],
      options,
    );
    const by = Object.fromEntries(tree.nodes.map((node) => [node.id, node]));
    expect(by.main.own).toBe(10);
    expect(by.render.x1).toBe(60);
    expect(by.fetch.x1).toBe(90);
  });

  test("gives a parent at least what its children add up to", () => {
    const tree = partition(
      [
        { id: "p", parent: null, bytes: 10 },
        { id: "a", parent: "p", bytes: 30 },
      ],
      options,
    );
    expect(tree.nodes[0].value).toBe(30);
    expect(tree.nodes[0].own).toBe(0);
  });
});
