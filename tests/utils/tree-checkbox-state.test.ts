// @vitest-environment node
import {
  resolveCheckboxState,
  toggleCheckboxNode,
} from "../../src/utils/tree-checkbox-state.js";

type Node = {
  id: string;
  disabled?: boolean;
  nodes?: Node[];
};

const tree: Node[] = [
  {
    id: "analytics",
    nodes: [
      {
        id: "engine",
        nodes: [{ id: "spark" }, { id: "hadoop" }],
      },
      { id: "sql-query" },
    ],
  },
  {
    id: "blockchain",
    nodes: [{ id: "platform" }],
  },
];

describe("resolveCheckboxState", () => {
  it("checks every descendant of a selected branch", () => {
    expect(resolveCheckboxState(tree, ["analytics"])).toEqual({
      checkedIds: ["analytics", "engine", "spark", "hadoop", "sql-query"],
      indeterminateIds: [],
    });
  });

  it("marks a partially selected branch indeterminate", () => {
    expect(resolveCheckboxState(tree, ["spark"])).toEqual({
      checkedIds: ["spark"],
      indeterminateIds: ["analytics", "engine"],
    });
  });

  it("selects a branch once every child is selected", () => {
    expect(resolveCheckboxState(tree, ["spark", "hadoop"]).checkedIds).toEqual([
      "engine",
      "spark",
      "hadoop",
    ]);
  });

  it("treats a branch with no children as a leaf", () => {
    const empty: Node[] = [{ id: "branch", nodes: [] }];
    expect(resolveCheckboxState(empty, ["branch"])).toEqual({
      checkedIds: ["branch"],
      indeterminateIds: [],
    });
  });

  it("prunes a disabled subtree from the selection", () => {
    const withDisabled: Node[] = [
      {
        id: "root",
        nodes: [
          { id: "enabled" },
          { id: "disabled", disabled: true, nodes: [{ id: "buried" }] },
        ],
      },
    ];

    expect(resolveCheckboxState(withDisabled, ["root"])).toEqual({
      checkedIds: ["root", "enabled"],
      indeterminateIds: [],
    });
  });

  it("reaches a fully selected branch across mixed disabled siblings", () => {
    const mixed: Node[] = [
      {
        id: "root",
        nodes: [
          { id: "one" },
          { id: "two", disabled: true },
          { id: "three" },
          { id: "four", disabled: true },
        ],
      },
    ];

    expect(resolveCheckboxState(mixed, ["one", "three"]).checkedIds).toEqual([
      "root",
      "one",
      "three",
    ]);
  });

  it("propagates indeterminate state up a deeply nested tree", () => {
    const deep: Node[] = [
      {
        id: "l1",
        nodes: [
          {
            id: "l2",
            nodes: [
              {
                id: "l3",
                nodes: [{ id: "l4-a" }, { id: "l4-b" }],
              },
            ],
          },
        ],
      },
    ];

    expect(resolveCheckboxState(deep, ["l4-a"])).toEqual({
      checkedIds: ["l4-a"],
      indeterminateIds: ["l1", "l2", "l3"],
    });

    expect(resolveCheckboxState(deep, ["l4-a", "l4-b"])).toEqual({
      checkedIds: ["l1", "l2", "l3", "l4-a", "l4-b"],
      indeterminateIds: [],
    });
  });

  it("drops ids with no matching node", () => {
    expect(resolveCheckboxState(tree, ["spark", "ghost"]).checkedIds).toEqual([
      "spark",
    ]);
    expect(
      resolveCheckboxState(tree, ["spark", "ghost"], { cascade: false })
        .checkedIds,
    ).toEqual(["spark"]);
  });

  it("returns an empty state for an empty tree", () => {
    const empty: Node[] = [];
    expect(resolveCheckboxState(empty, ["spark"])).toEqual({
      checkedIds: [],
      indeterminateIds: [],
    });
  });

  it("passes the selection through unchanged without cascade", () => {
    expect(
      resolveCheckboxState(tree, ["analytics", "spark"], { cascade: false }),
    ).toEqual({
      checkedIds: ["analytics", "spark"],
      indeterminateIds: [],
    });
  });
});

describe("toggleCheckboxNode", () => {
  // Returns a raw seed. Resolve with `resolveCheckboxState` when the
  // assertion needs derived ancestor checked/indeterminate state.
  it("checking a branch checks its descendants", () => {
    expect(toggleCheckboxNode(tree, [], "engine", true)).toEqual([
      "engine",
      "spark",
      "hadoop",
    ]);
  });

  it("unchecking one child leaves its ancestors indeterminate", () => {
    const checkedIds = toggleCheckboxNode(tree, [], "analytics", true);
    const next = toggleCheckboxNode(tree, checkedIds, "spark", false);

    expect(next).toEqual(["hadoop", "sql-query"]);
    expect(resolveCheckboxState(tree, next).indeterminateIds).toEqual([
      "analytics",
      "engine",
    ]);
  });

  it("unchecking a branch clears its whole subtree", () => {
    const checkedIds = toggleCheckboxNode(tree, [], "analytics", true);
    expect(toggleCheckboxNode(tree, checkedIds, "engine", false)).toEqual([
      "sql-query",
    ]);
  });

  it("checking the last sibling selects the parent", () => {
    const checkedIds = toggleCheckboxNode(tree, [], "spark", true);
    const next = toggleCheckboxNode(tree, checkedIds, "hadoop", true);
    expect(resolveCheckboxState(tree, next).checkedIds).toEqual([
      "engine",
      "spark",
      "hadoop",
    ]);
  });

  it("skips disabled descendants when checking a branch", () => {
    const withDisabled: Node[] = [
      {
        id: "root",
        nodes: [
          { id: "enabled" },
          { id: "disabled", disabled: true, nodes: [{ id: "buried" }] },
        ],
      },
    ];

    expect(toggleCheckboxNode(withDisabled, [], "root", true)).toEqual([
      "root",
      "enabled",
    ]);
  });

  it("ignores a disabled node", () => {
    const withDisabled: Node[] = [
      { id: "root", nodes: [{ id: "off", disabled: true }] },
    ];
    expect(toggleCheckboxNode(withDisabled, [], "off", true)).toEqual([]);
  });

  it("ignores an id with no matching node", () => {
    expect(toggleCheckboxNode(tree, ["spark"], "ghost", true)).toEqual([
      "spark",
    ]);
  });

  it("leaves ancestors untouched without cascade", () => {
    const options = { cascade: false };
    const checkedIds = toggleCheckboxNode(tree, [], "spark", true, options);

    expect(checkedIds).toEqual(["spark"]);
    expect(
      toggleCheckboxNode(tree, checkedIds, "hadoop", true, options),
    ).toEqual(["spark", "hadoop"]);
    expect(
      toggleCheckboxNode(tree, ["analytics"], "analytics", false, options),
    ).toEqual([]);
  });
});
