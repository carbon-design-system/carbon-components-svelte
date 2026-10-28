import {
  addIds,
  dropIndex,
  filterRows,
  insertIds,
  partitionItems,
  rangeIds,
  removeIds,
  reorderIds,
} from "../../src/TransferList/transfer-list-utils.js";

const items = ["a", "b", "c", "d", "e"].map((id) => ({
  id,
  text: id.toUpperCase(),
}));

describe("partitionItems", () => {
  it("keeps the selected order and the items order for the rest", () => {
    const { available, selected } = partitionItems(items, ["d", "b"]);

    expect(selected.map((i) => i.id)).toEqual(["d", "b"]);
    expect(available.map((i) => i.id)).toEqual(["a", "c", "e"]);
  });

  it("ignores unknown and repeated ids", () => {
    const { available, selected } = partitionItems(items, ["x", "a", "a"]);

    expect(selected.map((i) => i.id)).toEqual(["a"]);
    expect(available).toHaveLength(4);
  });
});

describe("filterRows", () => {
  it("returns the same array for an empty search", () => {
    expect(filterRows(items, "")).toBe(items);
  });

  it("matches anywhere, ignoring case, or through a custom match", () => {
    const rows = [
      { id: 1, text: "Billing admin" },
      { id: 2, text: "Audit" },
    ];

    expect(filterRows(rows, "ADMIN")).toEqual([rows[0]]);
    expect(filterRows(rows, "x", (row) => row.id === 2)).toEqual([rows[1]]);
  });
});

describe("addIds and removeIds", () => {
  it("appends in order and skips ids already selected", () => {
    expect(addIds(["a"], ["c", "a", "b"])).toEqual(["a", "c", "b"]);
  });

  it("removes without disturbing the order", () => {
    expect(removeIds(["a", "b", "c"], ["b"])).toEqual(["a", "c"]);
  });
});

describe("reorderIds", () => {
  const all = ["a", "b", "c", "d", "e"];

  it("moves a marked block up as one", () => {
    expect(reorderIds(all, all, new Set(["c", "d"]), "up")).toEqual([
      "a",
      "c",
      "d",
      "b",
      "e",
    ]);
  });

  it("holds a block at the top and returns the same array", () => {
    expect(reorderIds(all, all, new Set(["a", "b"]), "up")).toBe(all);
  });

  it("moves separated marks each by one", () => {
    expect(reorderIds(all, all, new Set(["b", "d"]), "down")).toEqual([
      "a",
      "c",
      "b",
      "e",
      "d",
    ]);
  });

  it("sends marks to an edge", () => {
    expect(reorderIds(all, all, new Set(["b", "d"]), "top")).toEqual([
      "b",
      "d",
      "a",
      "c",
      "e",
    ]);
    expect(reorderIds(all, all, new Set(["b", "d"]), "bottom")).toEqual([
      "a",
      "c",
      "e",
      "b",
      "d",
    ]);
  });

  it("leaves ids a search hides where they are", () => {
    const visible = ["a", "c", "e"];

    expect(reorderIds(all, visible, new Set(["c"]), "up")).toEqual([
      "c",
      "b",
      "a",
      "d",
      "e",
    ]);
  });
});

describe("insertIds", () => {
  it("puts ids in front of a row, moving ones already selected", () => {
    expect(insertIds(["a", "b", "c"], ["a", "b", "c"], ["c"], "a")).toEqual([
      "c",
      "a",
      "b",
    ]);
    expect(insertIds(["a", "b"], ["a", "b"], ["x"], "b")).toEqual([
      "a",
      "x",
      "b",
    ]);
  });

  it("appends after the last visible id for a null target", () => {
    expect(insertIds(["a", "b", "z"], ["a", "b"], ["x"], null)).toEqual([
      "a",
      "b",
      "x",
      "z",
    ]);
  });
});

describe("rangeIds and dropIndex", () => {
  it("spans the enabled rows between two indexes in either order", () => {
    const rows = [
      { id: 1, text: "1" },
      { id: 2, text: "2", disabled: true },
      { id: 3, text: "3" },
    ];

    expect(rangeIds(rows, 2, 0)).toEqual([1, 3]);
  });

  it("rounds a drop to the nearest edge between rows", () => {
    expect(dropIndex(59, 40, 10)).toBe(1);
    expect(dropIndex(61, 40, 10)).toBe(2);
    expect(dropIndex(-5, 40, 10)).toBe(0);
    expect(dropIndex(9999, 40, 10)).toBe(10);
  });
});
