// @vitest-environment node
import {
  pruneSelection,
  rangeBetween,
  selectEvery,
  selectWith,
} from "../../src/utils/selection-model.js";

const ids = ["a", "b", "c", "d", "e"];
const none = { selected: [], anchor: null };

describe("selectWith", () => {
  it("selects one on a plain click", () => {
    const state = selectWith({ selected: ["a", "b"], anchor: "a" }, ids, "c");
    expect(state).toEqual({ selected: ["c"], anchor: "c" });
  });

  it("toggles one and moves the anchor", () => {
    let state = selectWith(none, ids, "b", { toggle: true });
    state = selectWith(state, ids, "d", { toggle: true });
    expect(state.selected).toEqual(["b", "d"]);
    state = selectWith(state, ids, "b", { toggle: true });
    expect(state).toEqual({ selected: ["d"], anchor: "b" });
  });

  it("selects the range from the anchor in either direction", () => {
    const start = selectWith(none, ids, "b");
    expect(selectWith(start, ids, "d", { shift: true }).selected).toEqual([
      "b",
      "c",
      "d",
    ]);
    expect(selectWith(start, ids, "a", { shift: true }).selected).toEqual([
      "a",
      "b",
    ]);
  });

  it("keeps the anchor across a second range", () => {
    let state = selectWith(none, ids, "b");
    state = selectWith(state, ids, "e", { shift: true });
    state = selectWith(state, ids, "c", { shift: true });
    expect(state).toEqual({ selected: ["b", "c"], anchor: "b" });
  });

  it("adds a range with toggle and shift", () => {
    let state = selectWith(none, ids, "a");
    state = selectWith(state, ids, "d", { toggle: true });
    state = selectWith(state, ids, "e", { toggle: true, shift: true });
    expect(new Set(state.selected)).toEqual(new Set(["a", "d", "e"]));
  });

  it("ranges over the order it is given, so a sort keeps the selection", () => {
    const sorted = [...ids].reverse();
    const state = selectWith({ selected: ["b"], anchor: "b" }, sorted, "d", {
      shift: true,
    });
    expect(state.selected).toEqual(["d", "c", "b"]);
  });

  it("falls back when the anchor left the list", () => {
    const state = selectWith({ selected: ["x"], anchor: "x" }, ids, "c", {
      shift: true,
    });
    expect(state.selected).toEqual(["c"]);
  });
});

describe("helpers", () => {
  it("builds a range with a missing end", () => {
    expect(rangeBetween(ids, "a", "zz")).toEqual([]);
    expect(rangeBetween(ids, "zz", "c")).toEqual(["c"]);
  });

  it("selects every id and prunes the gone", () => {
    expect(selectEvery(ids).selected).toHaveLength(5);
    const state = { selected: ["a", "b", "z"], anchor: "z" };
    expect(pruneSelection(state, new Set(ids))).toEqual({
      selected: ["a", "b"],
      anchor: null,
    });
    const same = { selected: ["a"], anchor: "a" };
    expect(pruneSelection(same, new Set(ids))).toBe(same);
  });
});
