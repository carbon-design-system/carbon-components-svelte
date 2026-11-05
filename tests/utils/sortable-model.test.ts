import { applySort, moveItem } from "../../src/utils/sortable-model.js";

describe("moveItem and applySort", () => {
  const detail = (patch: object) => ({
    id: "x",
    from: "",
    to: "",
    oldIndex: 0,
    newIndex: 0,
    source: "keyboard" as const,
    ...patch,
  });

  it("moves to a final index without mutating", () => {
    const items = ["a", "b", "c", "d"];
    expect(moveItem(items, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(items, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(items).toEqual(["a", "b", "c", "d"]);
  });

  it("clamps the target and ignores a missing source", () => {
    expect(moveItem(["a", "b"], 0, 9)).toEqual(["b", "a"]);
    expect(moveItem(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });

  it("applies a reorder to an array", () => {
    const items = ["a", "b", "c"];
    const next = applySort(items, detail({ oldIndex: 2, newIndex: 0 }));
    expect(next).toEqual(["c", "a", "b"]);
    expect(items).toEqual(["a", "b", "c"]);
  });

  it("moves an item between named lists", () => {
    const lists = { todo: ["a", "b"], done: ["c"] };
    const next = applySort(
      lists,
      detail({ from: "todo", to: "done", oldIndex: 0, newIndex: 1 }),
    );
    expect(next).toEqual({ todo: ["b"], done: ["c", "a"] });
    expect(lists).toEqual({ todo: ["a", "b"], done: ["c"] });
  });

  it("reorders inside a named list", () => {
    const next = applySort(
      { todo: ["a", "b", "c"], done: [] },
      detail({ from: "todo", to: "todo", oldIndex: 0, newIndex: 2 }),
    );
    expect(next).toEqual({ todo: ["b", "c", "a"], done: [] });
  });

  it("leaves the data alone for an unknown list or a stale index", () => {
    const lists = { todo: ["a"], done: [] };
    expect(
      applySort(lists, detail({ from: "nope", to: "done", oldIndex: 0 })),
    ).toEqual(lists);
    expect(
      applySort(lists, detail({ from: "todo", to: "done", oldIndex: 4 })),
    ).toEqual(lists);
    expect(
      applySort(lists, detail({ from: "todo", to: "nope", oldIndex: 0 })),
    ).toEqual(lists);
  });
});
