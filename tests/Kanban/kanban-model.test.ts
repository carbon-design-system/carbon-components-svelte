// @vitest-environment node
import {
  applyMove,
  edgeSpeed,
  finalIndex,
  groupByColumn,
  hasRoom,
  slotAt,
  slotFor,
  stepTarget,
} from "../../src/Kanban/kanban-model.js";

const columns = [{ id: "a" }, { id: "b" }, { id: "c" }];
const items = [
  { id: "1", column: "a" },
  { id: "2", column: "b" },
  { id: "3", column: "a" },
  { id: "4", column: "a" },
  { id: "5", column: "c" },
];
const layout = (list: ReadonlyArray<{ id: string; column: string }>) =>
  columns.map((column) =>
    list
      .filter((item) => item.column === column.id)
      .map((item) => item.id)
      .join(""),
  );

describe("groupByColumn", () => {
  it("keeps array order per column and leaves out cards of unknown columns", () => {
    const { ids } = groupByColumn(columns, [
      ...items,
      { id: "x", column: "gone" },
    ]);
    expect(Object.fromEntries(ids)).toEqual({
      a: ["1", "3", "4"],
      b: ["2"],
      c: ["5"],
    });
  });
});

describe("applyMove", () => {
  it("moves across columns to an index, without touching the input", () => {
    const frozen = Object.freeze(items.map((item) => Object.freeze(item)));
    const next = applyMove(frozen, { id: "2", to: "a", index: 1 });
    expect(layout(next)).toEqual(["1234", "", "5"]);
    expect(next.find((item) => item.id === "2")?.column).toBe("a");
    expect(layout(frozen)).toEqual(["134", "2", "5"]);
  });

  it("reads index as the final position when reordering in a column", () => {
    expect(layout(applyMove(items, { id: "1", to: "a", index: 2 }))).toEqual([
      "341",
      "2",
      "5",
    ]);
    expect(layout(applyMove(items, { id: "4", to: "a", index: 0 }))).toEqual([
      "413",
      "2",
      "5",
    ]);
  });

  it("appends to an empty column and clamps a large index", () => {
    const single = [{ id: "1", column: "a" }];
    expect(applyMove(single, { id: "1", to: "b", index: 9 })).toEqual([
      { id: "1", column: "b" },
    ]);
    expect(layout(applyMove(items, { id: "1", to: "c", index: 99 }))).toEqual([
      "34",
      "2",
      "51",
    ]);
  });

  it("returns the same array when the card stays where it stands in its column", () => {
    expect(applyMove(items, { id: "3", to: "a", index: 1 })).toBe(items);
    expect(applyMove(items, { id: "nope", to: "a", index: 0 })).toBe(items);
  });
});

describe("slots", () => {
  it("finalIndex and slotFor invert each other around the dragged child", () => {
    for (const dragged of [-1, 0, 2]) {
      for (let index = 0; index < 4; index++) {
        expect(finalIndex(slotFor(index, dragged), dragged)).toBe(index);
      }
    }
  });

  it("treats the slots next to the dragged card as staying put", () => {
    expect(finalIndex(2, 2)).toBe(2);
    expect(finalIndex(3, 2)).toBe(2);
  });

  it("finds the slot by midpoints with O(log n) reads", () => {
    const reads: number[] = [];
    const midpoint = (slot: number) => {
      reads.push(slot);
      return slot * 10 + 5;
    };
    expect(slotAt(100, midpoint, 0)).toBe(0);
    expect(slotAt(100, midpoint, 504)).toBe(50);
    expect(slotAt(100, midpoint, 5000)).toBe(100);
    expect(reads.length).toBeLessThan(30);
  });
});

describe("hasRoom", () => {
  it("only limits a card entering from another column", () => {
    expect(hasRoom({ limit: 2 }, 2, false)).toBe(false);
    expect(hasRoom({ limit: 2 }, 1, false)).toBe(true);
    expect(hasRoom({ limit: 2 }, 3, true)).toBe(true);
    expect(hasRoom({}, 99, false)).toBe(true);
  });
});

describe("stepTarget", () => {
  const order = ["a", "b", "c", "d"];
  const size = (column: string) => ({ a: 3, b: 0, c: 2, d: 1 })[column] ?? 0;

  it("clamps up and down to the column and reports no move at an end", () => {
    const at = (index: number, key: "up" | "down" | "end") =>
      stepTarget({ order, size, from: { column: "a", index }, key }).target;
    expect(at(0, "up")).toBeNull();
    expect(at(3, "down")).toBeNull();
    expect(at(1, "end")).toEqual({ column: "a", index: 3 });
  });

  it("keeps the index, clamped, when changing column", () => {
    const step = (column: string, index: number, key: "next" | "previous") =>
      stepTarget({ order, size, from: { column, index }, key }).target;
    expect(step("a", 2, "next")).toEqual({ column: "b", index: 0 });
    expect(step("c", 2, "previous")).toEqual({ column: "b", index: 0 });
  });

  it("passes over skipped columns and stops at the ends", () => {
    const skip = (column: string) => column === "b" || column === "c";
    expect(
      stepTarget({
        order,
        size,
        skip,
        from: { column: "a", index: 0 },
        key: "next",
      }).target?.column,
    ).toBe("d");
    expect(
      stepTarget({ order, size, from: { column: "d", index: 0 }, key: "next" })
        .target,
    ).toBeNull();
  });

  it("names a full column instead of entering it", () => {
    const result = stepTarget({
      order,
      size,
      full: (column) => column === "b",
      from: { column: "a", index: 0 },
      key: "next",
    });
    expect(result).toEqual({ target: null, blocked: "b" });
  });
});

describe("edgeSpeed", () => {
  const box = { start: 0, end: 400, zone: 100, max: 1000 };

  it("is zero away from the edges and signed toward them", () => {
    expect(edgeSpeed({ ...box, point: 200 })).toBe(0);
    expect(edgeSpeed({ ...box, point: 0 })).toBe(-1000);
    expect(edgeSpeed({ ...box, point: 400 })).toBe(1000);
  });

  it("eases in with the square of the depth", () => {
    expect(edgeSpeed({ ...box, point: 50 })).toBe(-250);
    expect(edgeSpeed({ ...box, point: 350 })).toBe(250);
  });

  it("keeps scrolling past the box and shrinks the zone of a small box", () => {
    expect(edgeSpeed({ ...box, point: -50 })).toBe(-1000);
    expect(
      edgeSpeed({ point: 10, start: 0, end: 40, zone: 100, max: 100 }),
    ).toBe(-25);
    expect(edgeSpeed({ point: 5, start: 0, end: 0, zone: 100, max: 100 })).toBe(
      0,
    );
  });
});
