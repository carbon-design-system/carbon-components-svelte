// @vitest-environment node
import {
  diffIds,
  expandableIds,
  flattenVisible,
  indexTree,
  shownCheckedIds,
  unresolvedIds,
  withLoadedChildren,
} from "carbon-components-svelte/TreeSelect/tree-select-rows.js";

type Node = { id: string; hasChildren?: boolean; nodes?: Node[] };

const tree: Node[] = [
  {
    id: "a",
    nodes: [
      { id: "a1", nodes: [{ id: "a1x" }, { id: "a1y" }] },
      { id: "a2", hasChildren: true },
    ],
  },
  { id: "b" },
];

describe("flattenVisible", () => {
  it("lists only the rows under expanded ancestors, in document order", () => {
    const rows = flattenVisible(tree, new Set(["a"]));

    expect(rows.map((row) => row.node.id)).toEqual(["a", "a1", "a2", "b"]);
    expect(rows.map((row) => row.depth)).toEqual([0, 1, 1, 0]);
  });

  it("marks a lazy parent expandable and never opens it", () => {
    const rows = flattenVisible(tree, new Set(["a", "a2"]));
    const lazy = rows.find((row) => row.node.id === "a2");

    expect(lazy).toMatchObject({ expandable: true, expanded: true });
    expect(rows.map((row) => row.node.id)).toEqual(["a", "a1", "a2", "b"]);
  });

  it("numbers siblings for aria-posinset and aria-setsize", () => {
    const rows = flattenVisible(tree, new Set(["a"]));

    expect(rows.map((row) => [row.posInSet, row.setSize])).toEqual([
      [1, 2],
      [1, 2],
      [2, 2],
      [2, 2],
    ]);
  });

  it("returns no rows for no nodes", () => {
    expect(flattenVisible([], new Set())).toEqual([]);
  });
});

describe("indexTree", () => {
  it("records the parent of every node and numbers them in document order", () => {
    const { parentById, ordinalById, byId } = indexTree(tree);

    expect(parentById.get("a1x")).toBe("a1");
    expect(parentById.get("a")).toBeNull();
    expect([...ordinalById.keys()]).toEqual([
      "a",
      "a1",
      "a1x",
      "a1y",
      "a2",
      "b",
    ]);
    expect(byId.get("b")).toBe(tree[1]);
  });
});

describe("expandableIds", () => {
  it("lists nodes with loaded children and skips lazy and leaf nodes", () => {
    expect([...expandableIds(tree)].sort()).toEqual(["a", "a1"]);
  });
});

describe("withLoadedChildren", () => {
  it("returns the same tree when nothing has loaded", () => {
    expect(withLoadedChildren(tree, new Map())).toBe(tree);
  });

  it("lays loaded children over a lazy node without touching the input", () => {
    const loaded = new Map<string, Node[]>([["a2", [{ id: "a2x" }]]]);
    const next = withLoadedChildren(tree, loaded);

    const a2 = next[0].nodes?.[1];
    expect(a2?.nodes).toEqual([{ id: "a2x" }]);
    expect(tree[0].nodes?.[1]).not.toHaveProperty("nodes");
    expect(next[1]).toBe(tree[1]);
  });

  it("turns a lazy node that loads nothing into a leaf", () => {
    const next = withLoadedChildren(tree, new Map([["a2", []]]));

    expect(next[0].nodes?.[1]).toMatchObject({ nodes: [], hasChildren: false });
  });

  it("reaches children that were themselves loaded", () => {
    const loaded = new Map<string, Node[]>([
      ["a2", [{ id: "deep", hasChildren: true }]],
      ["deep", [{ id: "deeper" }]],
    ]);
    const next = withLoadedChildren(tree, loaded);

    expect(next[0].nodes?.[1].nodes?.[0].nodes).toEqual([{ id: "deeper" }]);
  });
});

describe("shownCheckedIds", () => {
  const index = indexTree(tree);
  const checked = ["a", "a1", "a1x", "a1y", "b"];

  it.each([
    ["all", ["a", "a1", "a1x", "a1y", "b"]],
    ["parent", ["a", "b"]],
    ["leaf", ["a1x", "a1y", "b"]],
  ] as const)("reports %s", (strategy, expected) => {
    expect(shownCheckedIds(checked, strategy, index)).toEqual(expected);
  });

  it("keeps a checked child whose parent is not checked", () => {
    expect(shownCheckedIds(["a1x"], "parent", index)).toEqual(["a1x"]);
  });
});

describe("diffIds", () => {
  it("splits two lists into what was added and what was removed", () => {
    expect(diffIds(["a", "b"], ["b", "c"])).toEqual({
      added: ["c"],
      removed: ["a"],
    });
  });
});

describe("unresolvedIds", () => {
  it("keeps unknown ids while a lazy parent has not loaded", () => {
    expect(unresolvedIds(["a1x", "a2-kid"], indexTree(tree))).toEqual([
      "a2-kid",
    ]);
  });

  it("returns none once every parent has loaded", () => {
    const loaded = withLoadedChildren(tree, new Map([["a2", [{ id: "k" }]]]));
    expect(unresolvedIds(["gone"], indexTree(loaded))).toEqual([]);
  });

  it("does not count a parent the user cleared", () => {
    const index = indexTree(tree);
    expect(unresolvedIds(["a2-kid"], index, new Set(["a2"]))).toEqual([]);
  });
});
