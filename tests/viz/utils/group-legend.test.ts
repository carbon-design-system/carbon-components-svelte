import {
  branchAccessor,
  colorGroups,
  dropGroups,
  listGroups,
  nextHidden,
  pruneGroups,
} from "../../../src/viz/utils/group-legend.js";

const rows = [
  { id: "a", parent: null, group: "x" },
  { id: "b", parent: "a", group: "y" },
  { id: "c", parent: "b", group: "x" },
  { id: "d", parent: null, group: "z" },
];
const groupOf = (row: (typeof rows)[number]) => row.group;

describe("group legend", () => {
  test("lists groups once, in first-seen order, and colors them stably", () => {
    expect(listGroups(rows, groupOf)).toEqual(["x", "y", "z"]);
    expect(listGroups(rows, undefined)).toEqual([]);
    const colors = colorGroups(["x", "y", "z"], 1, { y: "error" });
    expect(colors.y).toBe("var(--cds-viz-error)");
    expect(colors.x).not.toBe(colors.z);
  });

  test("drops rows of hidden groups, or prunes their subtrees in a hierarchy", () => {
    expect(dropGroups(rows, groupOf, new Set(["x"])).map((r) => r.id)).toEqual([
      "b",
      "d",
    ]);
    expect(
      pruneGroups(
        rows,
        (r) => r.id,
        (r) => r.parent,
        groupOf,
        new Set(["y"]),
      ).map((r) => r.id),
    ).toEqual(["a", "d"]);
    expect(dropGroups(rows, groupOf, new Set())).toBe(rows);
  });

  test("toggles a key and refuses to hide the last visible group", () => {
    expect(nextHidden([], "x", 3)).toEqual(["x"]);
    expect(nextHidden(["x"], "x", 3)).toEqual([]);
    expect(nextHidden(["x", "y"], "z", 3)).toBeNull();
  });

  test("keys a hierarchy by the branch under the center", () => {
    const idOf = (r: (typeof rows)[number]) => r.id;
    const parentOf = (r: (typeof rows)[number]) => r.parent;
    const deep = [...rows, { id: "e", parent: "c", group: "x" }];
    const top = branchAccessor(deep, idOf, parentOf, null);
    // Two top nodes, so each is a branch of its own.
    expect(deep.map((r, i) => top(r, i))).toEqual(["a", "a", "a", "d", "a"]);
    const drilled = branchAccessor(deep, idOf, parentOf, "a");
    expect(deep.map((r, i) => drilled(r, i))).toEqual(["", "b", "b", "", "b"]);
    const lone = branchAccessor(
      deep.filter((r) => r.id !== "d"),
      idOf,
      parentOf,
      null,
    );
    expect(lone({ id: "c", parent: "b", group: "x" }, 2)).toBe("b");
  });
});
