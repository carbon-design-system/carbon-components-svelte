// @vitest-environment node
import {
  buildTreeMaps,
  getAncestorIds,
  multiselectExpansionIds,
  ROOT_PARENT_ID,
  traverse,
  traverseVisible,
} from "../../src/utils/tree-nodes.js";

type Node = {
  id: string;
  disabled?: boolean;
  nodes?: Node[];
};

const tree: Node[] = [
  {
    id: "a",
    nodes: [
      { id: "a1", nodes: [{ id: "a1x" }] },
      { id: "a2", disabled: true, nodes: [{ id: "a2x" }] },
      { id: "a3" },
    ],
  },
  { id: "b", nodes: [{ id: "b1" }] },
];

describe("traverse", () => {
  it("flattens in pre-order, ignoring expansion", () => {
    expect(traverse(tree).map((n) => n.id)).toEqual([
      "a",
      "a1",
      "a1x",
      "a2",
      "a2x",
      "a3",
      "b",
      "b1",
    ]);
  });
});

describe("traverseVisible", () => {
  it("descends only into expanded nodes", () => {
    expect(traverseVisible(tree, new Set(["a"])).map((n) => n.id)).toEqual([
      "a",
      "a1",
      "a2",
      "a3",
      "b",
    ]);
  });

  it("shows nothing below a collapsed ancestor even if its child is expanded", () => {
    expect(traverseVisible(tree, new Set(["a1"])).map((n) => n.id)).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("buildTreeMaps", () => {
  const { nodeMap, parentIdById, childIdsByParentId } = buildTreeMaps(tree);

  it("indexes every node at every depth", () => {
    expect(nodeMap.size).toBe(8);
    expect(nodeMap.get("a1x")).toBe(tree[0].nodes?.[0].nodes?.[0]);
  });

  it("marks roots with the sentinel parent", () => {
    expect(parentIdById.get("a")).toBe(ROOT_PARENT_ID);
    expect(parentIdById.get("a2x")).toBe("a2");
    expect(childIdsByParentId.get(ROOT_PARENT_ID)).toEqual(["a", "b"]);
    expect(childIdsByParentId.get("a")).toEqual(["a1", "a2", "a3"]);
  });

  it("keeps leaves out of the child map", () => {
    expect(childIdsByParentId.has("a3")).toBe(false);
  });
});

describe("getAncestorIds", () => {
  const { parentIdById } = buildTreeMaps(tree);

  it("returns ancestors from the root down, without the id", () => {
    expect(getAncestorIds("a1x", parentIdById)).toEqual(["a", "a1"]);
  });

  it("is empty for a root, an unknown id and a missing map", () => {
    expect(getAncestorIds("a", parentIdById)).toEqual([]);
    expect(getAncestorIds("nope", parentIdById)).toEqual([]);
    expect(getAncestorIds("a", null)).toEqual([]);
  });
});

describe("multiselectExpansionIds", () => {
  const a = tree[0];

  it("node mode returns the node alone", () => {
    expect(multiselectExpansionIds(a, "node")).toEqual(["a"]);
  });

  it("shallow mode adds enabled direct children", () => {
    expect(multiselectExpansionIds(a, "shallow")).toEqual(["a", "a1", "a3"]);
  });

  it("deep mode skips a disabled subtree", () => {
    expect(multiselectExpansionIds(a, "deep")).toEqual([
      "a",
      "a1",
      "a1x",
      "a3",
    ]);
  });

  it("returns nothing for a disabled node", () => {
    expect(multiselectExpansionIds(a.nodes?.[1] as Node, "deep")).toEqual([]);
  });
});
