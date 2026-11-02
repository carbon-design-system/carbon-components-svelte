import type { QueryGroup } from "../../src/QueryBuilder/QueryBuilder.svelte";
import {
  appendNode,
  assignIds,
  findNode,
  hasIds,
  moveNode,
  removeNode,
  updateNode,
} from "../../src/QueryBuilder/query-tree.js";

function counter() {
  let n = 0;
  return () => `n${++n}`;
}

const tree = (): QueryGroup => ({
  id: "root",
  operator: "and",
  conditions: [
    { id: "a", field: "name", operator: "is", value: "a" },
    {
      id: "g",
      operator: "or",
      conditions: [
        { id: "b", field: "name", operator: "is", value: "b" },
        { id: "c", field: "name", operator: "is", value: "c" },
      ],
    },
  ],
});

describe("assignIds", () => {
  it("fills in missing ids in tree order, never repeating one in use", () => {
    const result = assignIds(
      {
        operator: "and",
        conditions: [
          { field: "x", operator: "is", value: 1 },
          { id: "n1", field: "x", operator: "is", value: 2 },
          {
            operator: "or",
            conditions: [{ field: "x", operator: "is", value: 3 }],
          },
        ],
      },
      counter(),
    );

    expect(hasIds(result)).toBe(true);
    const ids = [
      result.id,
      result.conditions[0].id,
      result.conditions[1].id,
      result.conditions[2].id,
    ];
    expect(new Set(ids).size).toBe(4);
    expect(result.conditions[1].id).toBe("n1");
  });

  it("returns the same tree when every node has an id", () => {
    const input = tree();
    expect(assignIds(input, counter())).toBe(input);
  });

  it("keeps the identity of branches that already have ids", () => {
    const input = tree();
    const branch = input.conditions[1];
    input.conditions.push({ field: "x", operator: "is", value: 1 });

    const result = assignIds(input, counter());

    expect(result).not.toBe(input);
    expect(result.conditions[1]).toBe(branch);
  });
});

describe("edits", () => {
  it("updates a node and shares every other branch", () => {
    const before = tree();
    const after = updateNode(before, "b", { value: "changed" });

    expect(findNode(after, "b")?.node).toMatchObject({ value: "changed" });
    expect(findNode(before, "b")?.node).toMatchObject({ value: "b" });
    expect(after.conditions[0]).toBe(before.conditions[0]);
    expect((after.conditions[1] as QueryGroup).conditions[1]).toBe(
      (before.conditions[1] as QueryGroup).conditions[1],
    );
  });

  it("updates the root and ignores an unknown id", () => {
    const before = tree();
    expect(updateNode(before, "root", { operator: "or" }).operator).toBe("or");
    expect(updateNode(before, "missing", { value: 1 })).toBe(before);
  });

  it("appends to a nested group", () => {
    const after = appendNode(tree(), "g", {
      id: "d",
      field: "name",
      operator: "is",
      value: "d",
    });

    expect(
      (after.conditions[1] as QueryGroup).conditions.map((node) => node.id),
    ).toEqual(["b", "c", "d"]);
  });

  it("removes a node but never the root", () => {
    const before = tree();
    expect(removeNode(before, "g").conditions.map((node) => node.id)).toEqual([
      "a",
    ]);
    expect(removeNode(before, "root")).toBe(before);
  });

  it("moves a node within its group and stops at the ends", () => {
    const before = tree();
    const down = moveNode(before, "b", 1);

    expect(
      (down.conditions[1] as QueryGroup).conditions.map((node) => node.id),
    ).toEqual(["c", "b"]);
    expect(moveNode(before, "b", -1)).toBe(before);
    expect(moveNode(before, "c", 1)).toBe(before);
    expect(moveNode(before, "a", 5).conditions.map((node) => node.id)).toEqual([
      "g",
      "a",
    ]);
  });
});
