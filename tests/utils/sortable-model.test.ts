import {
  applySort,
  edgeScrollSpeed,
  indexToSlot,
  insertionSlot,
  liftedKeyAction,
  moveItem,
  slotToIndex,
} from "../../src/utils/sortable-model.js";

describe("insertionSlot", () => {
  // Three 10px rows: midpoints 5, 15, 25.
  const midpoint = (index: number) => index * 10 + 5;

  it("finds the gap by comparing with item midpoints", () => {
    expect(insertionSlot(3, midpoint, -50)).toBe(0);
    expect(insertionSlot(3, midpoint, 4)).toBe(0);
    expect(insertionSlot(3, midpoint, 6)).toBe(1);
    expect(insertionSlot(3, midpoint, 26)).toBe(3);
    expect(insertionSlot(3, midpoint, 500)).toBe(3);
  });

  it("is zero for an empty list", () => {
    expect(insertionSlot(0, midpoint, 10)).toBe(0);
  });

  it("probes a 1,000 item list about ten times", () => {
    const probe = vi.fn(midpoint);
    expect(insertionSlot(1000, probe, 4995)).toBe(500);
    expect(probe.mock.calls.length).toBeLessThanOrEqual(11);
  });
});

describe("slots and indexes", () => {
  it("shifts the slots after the dragged item in its own list", () => {
    expect(slotToIndex(3, 1, true)).toBe(2);
    expect(slotToIndex(1, 1, true)).toBe(1);
    expect(slotToIndex(2, 1, true)).toBe(1);
    expect(slotToIndex(0, 1, true)).toBe(0);
  });

  it("does not shift slots of another list", () => {
    expect(slotToIndex(3, 1, false)).toBe(3);
  });

  it("round-trips through indexToSlot", () => {
    for (const oldIndex of [0, 2, 4]) {
      for (const index of [0, 1, 3, 4]) {
        expect(
          slotToIndex(indexToSlot(index, oldIndex, true), oldIndex, true),
        ).toBe(index);
      }
    }
  });
});

describe("edgeScrollSpeed", () => {
  const area = { start: 0, end: 300, zone: 50, maxSpeed: 1000 };

  it("is zero away from the edges", () => {
    expect(edgeScrollSpeed({ ...area, pointer: 150 })).toBe(0);
    expect(edgeScrollSpeed({ ...area, pointer: 50 })).toBe(0);
  });

  it("scrolls toward the edge the pointer presses on", () => {
    expect(edgeScrollSpeed({ ...area, pointer: 0 })).toBe(-1000);
    expect(edgeScrollSpeed({ ...area, pointer: 300 })).toBe(1000);
    expect(edgeScrollSpeed({ ...area, pointer: 275 })).toBe(500);
  });

  it("keeps going, capped, when the pointer is past the edge", () => {
    expect(edgeScrollSpeed({ ...area, pointer: 900 })).toBe(1500);
  });

  it("ramps up while the pointer stays in a zone", () => {
    const speed = (held: number) =>
      edgeScrollSpeed({ ...area, pointer: 300, held });
    expect(speed(0)).toBeCloseTo(150);
    expect(speed(200)).toBeGreaterThan(speed(0));
    expect(speed(400)).toBe(1000);
    expect(speed(4000)).toBe(1000);
  });

  it("leaves the middle third of a small area alone", () => {
    const small = { start: 0, end: 60, zone: 50 };
    expect(edgeScrollSpeed({ ...small, pointer: 30 })).toBe(0);
    expect(edgeScrollSpeed({ ...small, pointer: 15 })).toBeLessThan(0);
  });
});

describe("liftedKeyAction", () => {
  it("moves along a vertical list with Up and Down", () => {
    expect(liftedKeyAction("ArrowUp", "vertical", false)).toBe("back");
    expect(liftedKeyAction("ArrowDown", "vertical", false)).toBe("forward");
  });

  it("hands over to the neighbor list with the cross-axis arrows", () => {
    expect(liftedKeyAction("ArrowLeft", "vertical", false)).toBe("prevList");
    expect(liftedKeyAction("ArrowRight", "vertical", false)).toBe("nextList");
    expect(liftedKeyAction("ArrowUp", "horizontal", false)).toBe("prevList");
    expect(liftedKeyAction("ArrowDown", "horizontal", false)).toBe("nextList");
  });

  it("swaps the inline arrows in RTL", () => {
    expect(liftedKeyAction("ArrowRight", "horizontal", false)).toBe("forward");
    expect(liftedKeyAction("ArrowRight", "horizontal", true)).toBe("back");
    expect(liftedKeyAction("ArrowLeft", "horizontal", true)).toBe("forward");
    expect(liftedKeyAction("ArrowLeft", "vertical", true)).toBe("nextList");
    expect(liftedKeyAction("ArrowDown", "vertical", true)).toBe("forward");
  });

  it("ignores other keys", () => {
    expect(liftedKeyAction("a", "vertical", false)).toBeNull();
  });
});

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
