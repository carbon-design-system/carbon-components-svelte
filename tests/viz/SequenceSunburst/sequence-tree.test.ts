import { sequenceTree } from "../../../src/viz/SequenceSunburst/sequence-tree.js";

type Row = { path: string; users: number };
const rows: Row[] = [
  { path: "home/search/pdp/cart", users: 40 },
  { path: "home/search/pdp", users: 25 },
  { path: "home/pdp/cart", users: 20 },
  { path: "home/search", users: 15 },
  { path: "", users: 99 },
  { path: "home/pdp", users: 0 },
];

describe("sequenceTree", () => {
  test("builds a prefix tree, depth first, whose values are what passes through", () => {
    const tree = sequenceTree(rows, {
      steps: (row) => row.path,
      value: (row) => row.users,
    });
    expect(tree.total).toBe(100);
    expect(tree.nodes.map((node) => node.path.join(">"))).toEqual([
      "",
      "home",
      "home>search",
      "home>search>pdp",
      "home>search>pdp>cart",
      "home>pdp",
      "home>pdp>cart",
    ]);
    const by = Object.fromEntries(
      tree.nodes.map((node) => [node.path.join(">"), node]),
    );
    expect(by[""].step).toBe("All");
    expect(by.home.value).toBe(100);
    expect(by["home>search"].value).toBe(80);
    expect(by["home>search>pdp"].value).toBe(65);
    expect(by["home>search>pdp>cart"]).toMatchObject({
      value: 40,
      depth: 4,
      step: "cart",
    });
    expect(by["home>pdp"].rows).toHaveLength(1);
    expect(by["home>search"].parent).toBe(by.home.id);
  });

  test("takes step arrays, a custom separator, and counts one per row without a value", () => {
    const tree = sequenceTree(
      [{ steps: ["a", "b"] }, { steps: ["a"] }, { steps: "a > c" }],
      { steps: (row) => row.steps, separator: ">", rootLabel: "Sessions" },
    );
    expect(tree.total).toBe(3);
    expect(tree.nodes[0].step).toBe("Sessions");
    expect(tree.nodes.map((node) => node.step)).toEqual([
      "Sessions",
      "a",
      "b",
      "c",
    ]);
    expect(tree.nodes[1].value).toBe(3);
  });
});
