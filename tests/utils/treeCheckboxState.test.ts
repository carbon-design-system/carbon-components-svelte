import {
  resolveCheckboxState,
  toggleCheckboxNode,
} from "../../src/utils/treeCheckboxState.js";

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
  test("checks every descendant of a selected branch", () => {
    expect(resolveCheckboxState(tree, ["analytics"])).toEqual({
      checkedIds: ["analytics", "engine", "spark", "hadoop", "sql-query"],
      indeterminateIds: [],
    });
  });

  test("marks a partially selected branch indeterminate", () => {
    expect(resolveCheckboxState(tree, ["spark"])).toEqual({
      checkedIds: ["spark"],
      indeterminateIds: ["analytics", "engine"],
    });
  });

  test("selects a branch once every child is selected", () => {
    expect(resolveCheckboxState(tree, ["spark", "hadoop"]).checkedIds).toEqual([
      "engine",
      "spark",
      "hadoop",
    ]);
  });

  test("treats a branch with no children as a leaf", () => {
    const empty: Node[] = [{ id: "branch", nodes: [] }];
    expect(resolveCheckboxState(empty, ["branch"])).toEqual({
      checkedIds: ["branch"],
      indeterminateIds: [],
    });
  });

  test("prunes a disabled subtree from the selection", () => {
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

  test("reaches a fully selected branch across mixed disabled siblings", () => {
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

  test("propagates indeterminate state up a deeply nested tree", () => {
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

  test("drops ids with no matching node", () => {
    expect(resolveCheckboxState(tree, ["spark", "ghost"]).checkedIds).toEqual([
      "spark",
    ]);
    expect(
      resolveCheckboxState(tree, ["spark", "ghost"], { cascade: false })
        .checkedIds,
    ).toEqual(["spark"]);
  });

  test("returns an empty state for an empty tree", () => {
    const empty: Node[] = [];
    expect(resolveCheckboxState(empty, ["spark"])).toEqual({
      checkedIds: [],
      indeterminateIds: [],
    });
  });

  test("passes the selection through unchanged without cascade", () => {
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
  test("checking a branch checks its descendants", () => {
    expect(toggleCheckboxNode(tree, [], "engine", true)).toEqual([
      "engine",
      "spark",
      "hadoop",
    ]);
  });

  test("unchecking one child leaves its ancestors indeterminate", () => {
    const checkedIds = toggleCheckboxNode(tree, [], "analytics", true);
    const next = toggleCheckboxNode(tree, checkedIds, "spark", false);

    expect(next).toEqual(["hadoop", "sql-query"]);
    expect(resolveCheckboxState(tree, next).indeterminateIds).toEqual([
      "analytics",
      "engine",
    ]);
  });

  test("unchecking a branch clears its whole subtree", () => {
    const checkedIds = toggleCheckboxNode(tree, [], "analytics", true);
    expect(toggleCheckboxNode(tree, checkedIds, "engine", false)).toEqual([
      "sql-query",
    ]);
  });

  test("checking the last sibling selects the parent", () => {
    const checkedIds = toggleCheckboxNode(tree, [], "spark", true);
    const next = toggleCheckboxNode(tree, checkedIds, "hadoop", true);
    expect(resolveCheckboxState(tree, next).checkedIds).toEqual([
      "engine",
      "spark",
      "hadoop",
    ]);
  });

  test("skips disabled descendants when checking a branch", () => {
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

  test("ignores a disabled node", () => {
    const withDisabled: Node[] = [
      { id: "root", nodes: [{ id: "off", disabled: true }] },
    ];
    expect(toggleCheckboxNode(withDisabled, [], "off", true)).toEqual([]);
  });

  test("ignores an id with no matching node", () => {
    expect(toggleCheckboxNode(tree, ["spark"], "ghost", true)).toEqual([
      "spark",
    ]);
  });

  test("leaves ancestors untouched without cascade", () => {
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
