import {
  fitActionBar,
  type FitEntry,
  sameIds,
  shownSize,
} from "carbon-components-svelte/ActionBar/action-bar-fit.js";

const item = (id: string, extra: Partial<FitEntry> = {}): FitEntry => ({
  id,
  kind: "item",
  width: 40,
  priority: 0,
  pinned: false,
  ...extra,
});
const divider = (id: string): FitEntry => ({
  id,
  kind: "divider",
  width: 17,
  priority: 0,
  pinned: false,
});
const hiddenIds = (entries: FitEntry[], available: number) =>
  [...fitActionBar({ entries, available, moreWidth: 40 })].sort();

describe("fitActionBar", () => {
  it("collapses nothing while everything fits, trigger or not", () => {
    const entries = [item("a"), item("b"), item("c")];
    expect(hiddenIds(entries, 120)).toEqual([]);
  });

  it("collapses from the end, leaving room for the trigger", () => {
    const entries = [item("a"), item("b"), item("c"), item("d")];
    expect(hiddenIds(entries, 160)).toEqual([]);
    // Without room for the fourth, the third goes too: the trigger takes one.
    expect(hiddenIds(entries, 159)).toEqual(["c", "d"]);
    expect(hiddenIds(entries, 120)).toEqual(["c", "d"]);
    expect(hiddenIds(entries, 119)).toEqual(["b", "c", "d"]);
  });

  it("collapses the lowest priority first, then the later of equals", () => {
    const entries = [
      item("a", { priority: 1 }),
      item("b"),
      item("c", { priority: 1 }),
      item("d"),
    ];
    expect(hiddenIds(entries, 159)).toEqual(["b", "d"]);
    expect(hiddenIds(entries, 119)).toEqual(["b", "c", "d"]);
    expect(hiddenIds(entries, 79)).toEqual(["a", "b", "c", "d"]);
  });

  it("never collapses a pinned entry, even when it overflows", () => {
    const entries = [item("a", { pinned: true }), item("b"), item("c")];
    expect(hiddenIds(entries, 10)).toEqual(["b", "c"]);
  });

  it("shows a divider only between two buttons that show", () => {
    const entries = [
      item("a"),
      divider("d1"),
      item("b"),
      divider("d2"),
      item("c"),
    ];
    // 3 * 40 + 2 * 17 = 154.
    expect(hiddenIds(entries, 154)).toEqual([]);
    // c goes: b ends the row, so the divider before c goes with it.
    expect(hiddenIds(entries, 153)).toEqual(["c", "d2"]);
    expect(hiddenIds(entries, 120)).toEqual(["b", "c", "d1", "d2"]);
  });

  it("hides a leading, a doubled and a trailing divider", () => {
    const entries = [
      divider("d1"),
      item("a"),
      divider("d2"),
      divider("d3"),
      item("b"),
      divider("d4"),
    ];
    expect(hiddenIds(entries, 500)).toEqual(["d1", "d3", "d4"]);
  });

  it("counts the width of the dividers it keeps", () => {
    const entries = [item("a"), divider("d"), item("b"), item("c")];
    // a, d, b, c: 40 + 17 + 40 + 40.
    expect(hiddenIds(entries, 137)).toEqual([]);
    // The divider has nothing after it once b and c are gone.
    expect(hiddenIds(entries, 136)).toEqual(["b", "c", "d"]);
  });

  it("takes every collapsible entry when nothing fits", () => {
    const entries = [item("a"), item("b")];
    expect(hiddenIds(entries, 0)).toEqual(["a", "b"]);
  });

  it("collapses as few as it must, from a long list", () => {
    const entries = Array.from({ length: 1000 }, (_, i) => item(`i${i}`));
    for (const available of [40000, 39999, 20000, 1234, 79, 0]) {
      const fitting = Math.floor((available - 40) / 40);
      const expected = available >= 40000 ? 0 : 1000 - Math.max(0, fitting);
      expect(fitActionBar({ entries, available, moreWidth: 40 }).size).toBe(
        expected,
      );
    }
  });

  it("expands only once the entries fit with the slack to spare", () => {
    const entries = [item("a"), item("b"), item("c"), item("d")];
    const shrinkThenGrow = (available: number, previous: Set<string>) =>
      [
        ...fitActionBar({
          entries,
          available,
          moreWidth: 40,
          previous,
          slack: 16,
        }),
      ].sort();
    const collapsed = new Set(["c", "d"]);
    // It collapses at 159 px, as with no slack.
    expect(shrinkThenGrow(159, new Set())).toEqual(["c", "d"]);
    // One pixel back is not enough to expand.
    expect(shrinkThenGrow(160, collapsed)).toEqual(["c", "d"]);
    expect(shrinkThenGrow(175, collapsed)).toEqual(["c", "d"]);
    expect(shrinkThenGrow(176, collapsed)).toEqual([]);
    // It still collapses more at once.
    expect(shrinkThenGrow(119, collapsed)).toEqual(["b", "c", "d"]);
  });

  it("counts a field at its least width, so fields shrink first", () => {
    // A 230 px field that shrinks to 128 px, between two buttons.
    const field = item("field", { width: 230, minWidth: 128, pinned: true });
    const entries = [item("a"), field, item("b")];
    // 40 + 128 + 40: both buttons show, and the field takes what is left.
    expect(hiddenIds(entries, 310)).toEqual([]);
    expect(hiddenIds(entries, 208)).toEqual([]);
    // Below the field's least width, the buttons collapse.
    expect(hiddenIds(entries, 207)).toEqual(["a", "b"]);
    expect(shownSize(entries, new Set(["a", "b"]))).toBe(128);
  });
});

describe("sameIds", () => {
  it("compares by content", () => {
    expect(sameIds(new Set(["a", "b"]), new Set(["b", "a"]))).toBe(true);
    expect(sameIds(new Set(["a"]), new Set(["a", "b"]))).toBe(false);
    expect(sameIds(new Set(["a"]), new Set(["b"]))).toBe(false);
  });
});
