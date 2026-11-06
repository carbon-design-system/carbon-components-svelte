// @vitest-environment node
import {
  applyClick,
  applySelectionKey,
  clearSelection,
  createSelection,
  createSelectionState,
  deselectScope,
  extendTo,
  indexOfKey,
  keyLevel,
  moveFocus,
  pruneSelection,
  rangeKeys,
  selectAll,
  selectionModifiers,
  selectKey,
  summarizeSelection,
  toggleAll,
  toggleKey,
} from "../../src/utils/selection.js";

const order = ["a", "b", "c", "d", "e", "f"];
const ctx = { order };

const picked = (state: { selected: ReadonlySet<string | number> }) => [
  ...state.selected,
];

describe("selectKey", () => {
  it("selects one key and sets the anchor and focus", () => {
    const state = selectKey(createSelectionState(["a", "b"]), "c", ctx);
    expect(picked(state)).toEqual(["c"]);
    expect(state.anchor).toBe("c");
    expect(state.focus).toBe("c");
  });

  it("ignores a disabled key", () => {
    const before = createSelectionState(["a"]);
    const state = selectKey(before, "c", {
      ...ctx,
      isDisabled: (key) => key === "c",
    });
    expect(state).toBe(before);
  });
});

describe("toggleKey", () => {
  it("adds and removes a key and keeps the rest", () => {
    let state = createSelectionState(["a"]);
    state = toggleKey(state, "c", ctx);
    expect(picked(state)).toEqual(["a", "c"]);
    state = toggleKey(state, "a", ctx);
    expect(picked(state)).toEqual(["c"]);
    expect(state.anchor).toBe("a");
  });

  it("honors force", () => {
    const state = createSelectionState(["a"]);
    expect(picked(toggleKey(state, "a", ctx, true))).toEqual(["a"]);
    expect(picked(toggleKey(state, "a", ctx, false))).toEqual([]);
    expect(picked(toggleKey(state, "b", ctx, true))).toEqual(["a", "b"]);
  });

  it("single mode replaces, and deselects only with allowDeselect", () => {
    const single = { ...ctx, mode: "single" as const };
    let state = toggleKey(createSelectionState(["a"]), "b", single);
    expect(picked(state)).toEqual(["b"]);
    const same = toggleKey(state, "b", single);
    expect(picked(same)).toEqual(["b"]);
    state = toggleKey(state, "b", { ...single, allowDeselect: true });
    expect(picked(state)).toEqual([]);
  });
});

describe("extendTo", () => {
  const start = selectKey(createSelectionState<string>(), "b", ctx);

  it("replaces the selection with the range from the anchor", () => {
    const state = extendTo(start, "d", ctx);
    expect(picked(state)).toEqual(["b", "c", "d"]);
    expect(state.anchor).toBe("b");
    expect(state.focus).toBe("d");
  });

  it("walks backward when the target is before the anchor", () => {
    expect(picked(extendTo(start, "a", ctx)).sort()).toEqual(["a", "b"]);
  });

  it("shrinks the range when the target moves back toward a kept anchor", () => {
    const wide = extendTo(start, "e", ctx);
    expect(picked(extendTo(wide, "c", ctx))).toEqual(["b", "c"]);
  });

  it("moves the anchor with anchorOnRange move so ranges chain", () => {
    const state = extendTo(start, "d", { ...ctx, anchorOnRange: "move" });
    expect(state.anchor).toBe("d");
    expect(
      picked(extendTo(state, "f", { ...ctx, anchorOnRange: "move" })),
    ).toEqual(["d", "e", "f"]);
  });

  it("adds a range to what is selected", () => {
    const withOther = toggleKey(
      selectKey(createSelectionState<string>(), "a", ctx),
      "e",
      ctx,
    );
    const state = extendTo(withOther, "c", ctx, "add");
    expect(picked(state).sort()).toEqual(["a", "c", "d", "e"]);
  });

  it("removes a range from what is selected", () => {
    const all = selectAll(createSelectionState<string>(), ctx);
    const anchored = { ...all, anchor: "b" };
    expect(picked(extendTo(anchored, "d", ctx, "remove"))).toEqual([
      "a",
      "e",
      "f",
    ]);
  });

  it("skips disabled keys inside the range", () => {
    const state = extendTo(start, "e", {
      ...ctx,
      isDisabled: (key) => key === "c",
    });
    expect(picked(state)).toEqual(["b", "d", "e"]);
  });

  it("selects just the target when there is no anchor", () => {
    const state = extendTo(createSelectionState(["a"]), "d", ctx);
    expect(picked(state)).toEqual(["d"]);
  });

  it("falls back to one key when the anchor left the order", () => {
    const stale = { ...start, anchor: "gone" };
    expect(picked(extendTo(stale, "d", ctx))).toEqual(["d"]);
    expect(picked(extendTo(stale, "d", ctx, "add"))).toEqual(["b", "d"]);
  });

  it("reads the CURRENT order, so a sort changes the range", () => {
    const sorted = ["f", "e", "d", "c", "b", "a"];
    const state = extendTo(
      selectKey(createSelectionState<string>(), "f", { order: sorted }),
      "d",
      { order: sorted },
    );
    expect(picked(state)).toEqual(["f", "e", "d"]);
  });

  it("uses a custom range for a rectangle in a grid", () => {
    const cells = ["0:0", "0:1", "0:2", "1:0", "1:1", "1:2"];
    const rect = (from: string, to: string) => {
      const [r1, c1] = from.split(":").map(Number);
      const [r2, c2] = to.split(":").map(Number);
      return cells.filter((cell) => {
        const [r, c] = cell.split(":").map(Number);
        return (
          r >= Math.min(r1, r2) &&
          r <= Math.max(r1, r2) &&
          c >= Math.min(c1, c2) &&
          c <= Math.max(c1, c2)
        );
      });
    };
    const gridCtx = { order: cells, range: rect };
    const state = extendTo(
      selectKey(createSelectionState<string>(), "0:1", gridCtx),
      "1:2",
      gridCtx,
    );
    expect(picked(state)).toEqual(["0:1", "0:2", "1:1", "1:2"]);
  });

  it("single mode selects the target", () => {
    const state = extendTo(start, "e", { ...ctx, mode: "single" });
    expect(picked(state)).toEqual(["e"]);
  });

  it("returns the same state when nothing changes", () => {
    const wide = extendTo(start, "d", ctx);
    expect(extendTo(wide, "d", ctx)).toBe(wide);
  });
});

describe("rangeKeys", () => {
  it("is null without an anchor or when a key is not in the order", () => {
    expect(rangeKeys(null, "b", ctx)).toBeNull();
    expect(rangeKeys("a", "zz", ctx)).toBeNull();
    expect(rangeKeys("zz", "a", ctx)).toBeNull();
    expect(rangeKeys("b", "d", ctx)).toEqual(["b", "c", "d"]);
  });
});

describe("selectAll, deselectScope, clear", () => {
  it("selects every selectable key in scope and keeps hidden ones", () => {
    const state = selectAll(createSelectionState(["x"]), {
      ...ctx,
      isDisabled: (key) => key === "b",
    });
    expect(picked(state)).toEqual(["x", "a", "c", "d", "e", "f"]);
  });

  it("is a no-op in single mode", () => {
    const state = createSelectionState(["a"]);
    expect(selectAll(state, { ...ctx, mode: "single" })).toBe(state);
  });

  it("selects a scope other than the order", () => {
    expect(
      picked(selectAll(createSelectionState<string>(), ctx, ["x", "y"])),
    ).toEqual(["x", "y"]);
  });

  it("deselects only the scope", () => {
    const state = deselectScope(createSelectionState(["a", "b", "x"]), ctx);
    expect(picked(state)).toEqual(["x"]);
  });

  it("clears the selection and the anchor but keeps the focus", () => {
    const state = clearSelection({
      ...createSelectionState(["a", "b"], "a", "b"),
    });
    expect(picked(state)).toEqual([]);
    expect(state.anchor).toBeNull();
    expect(state.focus).toBe("b");
    const empty = createSelectionState<string>();
    expect(clearSelection(empty)).toBe(empty);
  });
});

describe("summarizeSelection and toggleAll", () => {
  it("reports none, some and all over the scope", () => {
    expect(
      summarizeSelection(createSelectionState<string>(), order).state,
    ).toBe("none");
    expect(
      summarizeSelection(createSelectionState(["a"]), order),
    ).toMatchObject({
      state: "some",
      indeterminate: true,
      checked: false,
      count: 1,
      total: 6,
    });
    expect(
      summarizeSelection(createSelectionState(order), order),
    ).toMatchObject({ state: "all", checked: true });
  });

  it("counts selected keys outside the scope as hidden, not as selected", () => {
    const summary = summarizeSelection(createSelectionState(["a", "x", "y"]), [
      "a",
      "b",
    ]);
    expect(summary).toMatchObject({
      count: 1,
      total: 2,
      size: 3,
      hidden: 2,
      state: "some",
    });
  });

  it("skips disabled keys", () => {
    const summary = summarizeSelection(
      createSelectionState(["a", "c"]),
      ["a", "b", "c"],
      (key) => key === "b",
    );
    expect(summary.state).toBe("all");
    expect(summary.total).toBe(2);
  });

  it("is none for an empty scope", () => {
    expect(summarizeSelection(createSelectionState(["a"]), []).state).toBe(
      "none",
    );
  });

  it("toggleAll: none selects all, all clears the scope, some clears by default", () => {
    const none = createSelectionState<string>();
    const all = toggleAll(none, ctx);
    expect(picked(all)).toEqual(order);
    expect(picked(toggleAll(all, ctx))).toEqual([]);
    const some = createSelectionState(["a", "x"]);
    expect(picked(toggleAll(some, ctx))).toEqual(["x"]);
    expect(picked(toggleAll(some, ctx, order, "all"))).toEqual([
      "a",
      "x",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
  });
});

describe("pruneSelection", () => {
  it("drops keys, the anchor and the focus that left", () => {
    const state = createSelectionState(["a", "b", "c"], "a", "b");
    const pruned = pruneSelection(state, new Set(["b", "c"]));
    expect(picked(pruned)).toEqual(["b", "c"]);
    expect(pruned.anchor).toBeNull();
    expect(pruned.focus).toBe("b");
  });

  it("returns the same state when nothing left", () => {
    const state = createSelectionState(["a"], "a", "a");
    expect(pruneSelection(state, new Set(["a", "b"]))).toBe(state);
  });
});

describe("selectionModifiers", () => {
  it("accepts Cmd or Ctrl by default", () => {
    expect(selectionModifiers({ metaKey: true })).toEqual({
      shift: false,
      toggle: true,
    });
    expect(selectionModifiers({ ctrlKey: true, shiftKey: true })).toEqual({
      shift: true,
      toggle: true,
    });
    expect(selectionModifiers({})).toEqual({ shift: false, toggle: false });
  });

  it("platform mode is strict: Ctrl off Apple, so Meta alone never toggles", () => {
    expect(selectionModifiers({ metaKey: true }, "platform").toggle).toBe(
      false,
    );
    expect(selectionModifiers({ ctrlKey: true }, "platform").toggle).toBe(true);
  });
});

describe("applyClick", () => {
  const base = selectKey(createSelectionState<string>(), "b", ctx);

  it("click selects alone", () => {
    expect(picked(applyClick(base, "d", {}, ctx))).toEqual(["d"]);
  });

  it("toggle flips one", () => {
    expect(picked(applyClick(base, "d", { toggle: true }, ctx))).toEqual([
      "b",
      "d",
    ]);
  });

  it("shift selects the range, shift+toggle adds it", () => {
    expect(picked(applyClick(base, "d", { shift: true }, ctx))).toEqual([
      "b",
      "c",
      "d",
    ]);
    const other = toggleKey(
      selectKey(createSelectionState<string>(), "a", ctx),
      "f",
      ctx,
    );
    const state = applyClick(
      { ...other, anchor: "c" },
      "e",
      { shift: true, toggle: true },
      ctx,
    );
    expect(picked(state).sort()).toEqual(["a", "c", "d", "e", "f"]);
  });

  it("single mode: shift behaves as a click", () => {
    expect(
      picked(
        applyClick(base, "e", { shift: true }, { ...ctx, mode: "single" }),
      ),
    ).toEqual(["e"]);
  });
});

describe("applySelectionKey", () => {
  const from = (
    focus: string,
    selected: string[] = [],
    anchor: string | null = focus,
  ) => createSelectionState(selected, anchor, focus);
  const press = (
    state: ReturnType<typeof from>,
    key: string,
    extra = {},
    options = {},
  ) => applySelectionKey(state, { key, ...extra }, { ...ctx, ...options });

  it("an arrow moves the focus and not the selection", () => {
    const result = press(from("b", ["a"]), "ArrowDown");
    expect(result.handled).toBe(true);
    expect(result.focus).toBe("c");
    expect(result.state.focus).toBe("c");
    expect(picked(result.state)).toEqual(["a"]);
  });

  it("an arrow with followFocus selects the key it lands on", () => {
    const result = press(
      from("b", ["a"]),
      "ArrowDown",
      {},
      { followFocus: true },
    );
    expect(picked(result.state)).toEqual(["c"]);
    expect(result.intent).toBe("select");
  });

  it("Ctrl+arrow moves without selecting, even with followFocus", () => {
    const result = press(
      from("b", ["a"]),
      "ArrowDown",
      { ctrlKey: true },
      { followFocus: true },
    );
    expect(result.state.focus).toBe("c");
    expect(picked(result.state)).toEqual(["a"]);
  });

  it("Shift+arrow extends the range and keeps the anchor", () => {
    let state = selectKey(createSelectionState<string>(), "b", ctx);
    state = press(state, "ArrowDown", { shiftKey: true }).state;
    state = press(state, "ArrowDown", { shiftKey: true }).state;
    expect(picked(state)).toEqual(["b", "c", "d"]);
    expect(state.anchor).toBe("b");
    state = press(state, "ArrowUp", { shiftKey: true }).state;
    expect(picked(state)).toEqual(["b", "c"]);
    state = press(state, "ArrowUp", { shiftKey: true }).state;
    state = press(state, "ArrowUp", { shiftKey: true }).state;
    expect(picked(state).sort()).toEqual(["a", "b"]);
  });

  it("Shift+arrow starts at the focus when there is no anchor", () => {
    const result = press(from("c", [], null), "ArrowDown", { shiftKey: true });
    expect(picked(result.state)).toEqual(["c", "d"]);
  });

  it("Shift+arrow toggles the key it lands on with shiftArrow toggle", () => {
    let state = from("a", ["a"]);
    state = press(
      state,
      "ArrowDown",
      { shiftKey: true },
      { shiftArrow: "toggle" },
    ).state;
    expect(picked(state)).toEqual(["a", "b"]);
    state = press(
      state,
      "ArrowUp",
      { shiftKey: true },
      { shiftArrow: "toggle" },
    ).state;
    expect(picked(state)).toEqual(["b"]);
  });

  it("Home and End move to the ends; with Shift they extend", () => {
    expect(press(from("c"), "Home").focus).toBe("a");
    expect(press(from("c"), "End").focus).toBe("f");
    expect(picked(press(from("c"), "End", { shiftKey: true }).state)).toEqual([
      "c",
      "d",
      "e",
      "f",
    ]);
    expect(
      picked(
        press(from("c"), "Home", { shiftKey: true, ctrlKey: true }).state,
      ).sort(),
    ).toEqual(["a", "b", "c"]);
  });

  it("stops at the ends and still handles the key", () => {
    const result = press(from("f"), "ArrowDown");
    expect(result.handled).toBe(true);
    expect(result.focus).toBeNull();
    expect(result.state.focus).toBe("f");
    expect(press(from("f"), "ArrowDown", {}, { wrap: true }).focus).toBe("a");
  });

  it("steps over disabled keys", () => {
    const result = press(
      from("a"),
      "ArrowDown",
      {},
      { isDisabled: (key: string) => key === "b" },
    );
    expect(result.focus).toBe("c");
  });

  it("Space toggles the focused key; Shift+Space selects the range to it", () => {
    const toggled = press(from("c", ["a"]), " ");
    expect(picked(toggled.state)).toEqual(["a", "c"]);
    expect(press(toggled.state, " ").state.selected.has("c")).toBe(false);
    const range = press(from("d", ["b"], "b"), " ", { shiftKey: true });
    expect(picked(range.state)).toEqual(["b", "c", "d"]);
  });

  it("Space in single mode selects, Enter too", () => {
    const single = { mode: "single" as const };
    expect(picked(press(from("c"), " ", {}, single).state)).toEqual(["c"]);
    expect(picked(press(from("c"), "Enter", {}, single).state)).toEqual(["c"]);
    expect(press(from("c"), "Enter").handled).toBe(false);
    expect(press(from("c"), "Enter", {}, { enterSelects: true }).handled).toBe(
      true,
    );
  });

  it("Ctrl+A and Cmd+A select all; not in single mode", () => {
    expect(picked(press(from("c"), "a", { ctrlKey: true }).state)).toEqual(
      order,
    );
    expect(picked(press(from("c"), "A", { metaKey: true }).state)).toEqual(
      order,
    );
    expect(
      press(from("c"), "a", { ctrlKey: true }, { mode: "single" }).handled,
    ).toBe(false);
  });

  it("Escape clears, and is left alone when nothing is selected", () => {
    const cleared = press(from("c", ["a", "b"]), "Escape");
    expect(cleared.handled).toBe(true);
    expect(cleared.intent).toBe("clear");
    expect(picked(cleared.state)).toEqual([]);
    expect(press(from("c"), "Escape").handled).toBe(false);
  });

  it("ignores Alt chords and unrelated keys", () => {
    expect(press(from("c"), "ArrowDown", { altKey: true }).handled).toBe(false);
    expect(press(from("c"), "x").handled).toBe(false);
  });

  it("does nothing on an empty list", () => {
    expect(
      applySelectionKey(
        createSelectionState<string>(),
        { key: "ArrowDown" },
        { order: [] },
      ).handled,
    ).toBe(false);
  });

  it("starts at the first key when nothing has the focus", () => {
    expect(press(createSelectionState<string>(), "ArrowDown").focus).toBe("a");
    expect(press(createSelectionState<string>(), "ArrowUp").focus).toBe("f");
  });

  it("horizontal axis swaps Left and Right in RTL", () => {
    const options = { axis: "horizontal" as const };
    expect(press(from("c"), "ArrowRight", {}, options).focus).toBe("d");
    expect(
      press(from("c"), "ArrowRight", {}, { ...options, rtl: true }).focus,
    ).toBe("b");
    expect(
      press(from("c"), "ArrowLeft", {}, { ...options, rtl: true }).focus,
    ).toBe("d");
    expect(press(from("c"), "ArrowDown", {}, options).handled).toBe(false);
  });

  it("Page keys step by pageSize when set", () => {
    expect(press(from("a"), "PageDown", {}, { pageSize: 4 }).focus).toBe("e");
    expect(press(from("a"), "PageDown", {}, { pageSize: 40 }).focus).toBe("f");
    expect(press(from("a"), "PageDown").handled).toBe(false);
  });

  it("move picks the next key for a grid", () => {
    const move = (focus: unknown, event: { key: string }) =>
      event.key === "ArrowDown" ? (focus === "a" ? "d" : "f") : undefined;
    expect(press(from("a"), "ArrowDown", {}, { move }).focus).toBe("d");
    expect(
      press(from("a"), "ArrowRight", {}, { move, axis: "horizontal" }).focus,
    ).toBe("b");
  });
});

describe("tree", () => {
  const nodes = [
    {
      id: "root",
      nodes: [{ id: "x", nodes: [{ id: "x1" }, { id: "x2" }] }, { id: "y" }],
    },
    { id: "other" },
  ];
  const treeCtx = {
    order: ["root", "x", "x1", "x2", "y", "other"],
    tree: { nodes },
  };

  it("selecting a parent selects its descendants", () => {
    const state = toggleKey(createSelectionState<string>(), "x", treeCtx);
    expect(picked(state).sort()).toEqual(["x", "x1", "x2"]);
    expect(keyLevel(state, "root")).toBe("some");
    expect(keyLevel(state, "x1")).toBe("all");
    expect(keyLevel(state, "other")).toBe("none");
  });

  it("selecting every child selects the parent", () => {
    let state = toggleKey(createSelectionState<string>(), "x1", treeCtx);
    expect(keyLevel(state, "x")).toBe("some");
    state = toggleKey(state, "x2", treeCtx);
    expect(keyLevel(state, "x")).toBe("all");
    expect(keyLevel(state, "root")).toBe("some");
    state = toggleKey(state, "y", treeCtx);
    expect(keyLevel(state, "root")).toBe("all");
  });

  it("deselecting one child makes the ancestors indeterminate", () => {
    let state = toggleKey(createSelectionState<string>(), "root", treeCtx);
    expect(picked(state).sort()).toEqual(["root", "x", "x1", "x2", "y"]);
    state = toggleKey(state, "x1", treeCtx);
    expect(keyLevel(state, "x")).toBe("some");
    expect(keyLevel(state, "root")).toBe("some");
    expect(state.selected.has("x2")).toBe(true);
  });

  it("a click on an indeterminate parent selects it all", () => {
    let state = toggleKey(createSelectionState<string>(), "x1", treeCtx);
    state = toggleKey(state, "x", treeCtx);
    expect(picked(state).sort()).toEqual(["x", "x1", "x2"]);
  });

  it("a range over visible rows selects the parent once its children are covered", () => {
    const start = selectKey(createSelectionState<string>(), "x1", treeCtx);
    const state = extendTo({ ...start, anchor: "x1" }, "x2", treeCtx);
    expect(picked(state).sort()).toEqual(["x", "x1", "x2"]);
    expect(keyLevel(state, "root")).toBe("some");
  });

  it("disabled nodes are left out of the cascade", () => {
    const withDisabled = {
      order: ["p", "c1", "c2"],
      tree: {
        nodes: [
          { id: "p", nodes: [{ id: "c1" }, { id: "c2", disabled: true }] },
        ],
      },
    };
    const state = toggleKey(createSelectionState<string>(), "p", withDisabled);
    expect(picked(state).sort()).toEqual(["c1", "p"]);
  });

  it("cascade false leaves parents alone", () => {
    const flat = { order: treeCtx.order, tree: { nodes, cascade: false } };
    const state = toggleKey(createSelectionState<string>(), "x", flat);
    expect(picked(state)).toEqual(["x"]);
    expect(state.indeterminate.size).toBe(0);
  });
});

describe("indexOfKey", () => {
  it("finds a key in a short and a long list", () => {
    expect(indexOfKey(order, "c")).toBe(2);
    expect(indexOfKey(order, "zz")).toBe(-1);
    expect(indexOfKey(order, null)).toBe(-1);
    const long = Array.from({ length: 5000 }, (_, index) => index);
    expect(indexOfKey(long, 4321)).toBe(4321);
    expect(indexOfKey(long, 5001)).toBe(-1);
  });

  it("rebuilds the lookup when the array is grown in place", () => {
    const long = Array.from({ length: 100 }, (_, index) => index);
    expect(indexOfKey(long, 150)).toBe(-1);
    long.push(150);
    expect(indexOfKey(long, 150)).toBe(100);
  });
});

describe("createSelection", () => {
  const rows = order.map((id) => ({ id }));

  it("is a store: subscribers see each change once", () => {
    const selection = createSelection({ keys: order });
    const seen: number[] = [];
    const stop = selection.subscribe((state) => seen.push(state.selected.size));
    selection.select("a");
    selection.select("a");
    selection.toggle("b");
    stop();
    selection.toggle("c");
    expect(seen).toEqual([0, 1, 2]);
  });

  it("reads keys from items with getKey and from a function", () => {
    let current = rows;
    const selection = createSelection({
      keys: () => current,
      getKey: (row: { id: string }) => row.id,
    });
    selection.select("b");
    selection.extendTo("d");
    expect(selection.toArray()).toEqual(["b", "c", "d"]);
    current = [...rows].reverse();
    selection.select("f");
    selection.extendTo("d");
    expect(selection.toArray()).toEqual(["f", "e", "d"]);
  });

  it("starts from initial", () => {
    const selection = createSelection({ keys: order, initial: ["a", "c"] });
    expect(selection.isSelected("c")).toBe(true);
    expect(selection.summary().state).toBe("some");
  });

  it("keeps selections a filter hides by default, and counts them as hidden", () => {
    const selection = createSelection({ keys: order, initial: ["a", "b"] });
    selection.setKeys(["b", "c"]);
    expect(selection.toArray()).toEqual(["a", "b"]);
    expect(selection.summary()).toMatchObject({
      count: 1,
      total: 2,
      hidden: 1,
      state: "some",
    });
    selection.selectAll();
    expect(selection.toArray()).toEqual(["a", "b", "c"]);
    expect(selection.summary().state).toBe("all");
  });

  it("drops them with hidden drop", () => {
    const selection = createSelection({
      keys: order,
      initial: ["a", "b"],
      hidden: "drop",
    });
    selection.select("a");
    selection.setKeys(["b", "c"]);
    expect(selection.toArray()).toEqual([]);
    expect(selection.get().anchor).toBeNull();
  });

  it("selectAll all reaches keys the order leaves out", () => {
    const selection = createSelection({ keys: ["a", "b"], allKeys: order });
    selection.selectAll("all");
    expect(selection.toArray()).toEqual(order);
    expect(selection.summary()).toMatchObject({
      count: 2,
      total: 2,
      hidden: 4,
    });
  });

  it("separates focus from selection", () => {
    const selection = createSelection({ keys: order, initial: ["a"] });
    selection.onItemFocus("d");
    expect(selection.get().focus).toBe("d");
    expect(selection.toArray()).toEqual(["a"]);
  });

  it("handles clicks with the event's modifiers", () => {
    const selection = createSelection({ keys: order });
    selection.onItemClick({}, "b");
    selection.onItemClick({ shiftKey: true }, "d");
    expect(selection.toArray()).toEqual(["b", "c", "d"]);
    selection.onItemClick({ metaKey: true }, "f");
    expect(selection.toArray()).toEqual(["b", "c", "d", "f"]);
    selection.onItemClick({ ctrlKey: true }, "c");
    expect(selection.toArray()).toEqual(["b", "d", "f"]);
    selection.onItemClick({}, "e");
    expect(selection.toArray()).toEqual(["e"]);
  });

  it("handles keys, calls preventDefault and returns the key to focus", () => {
    const selection = createSelection({ keys: order, initial: ["b"] });
    selection.onItemFocus("b");
    const preventDefault = vi.fn();
    const focus = selection.onItemKeydown({
      key: "ArrowDown",
      shiftKey: true,
      preventDefault,
    } as unknown as KeyboardEvent);
    expect(focus).toBe("c");
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(selection.toArray()).toEqual(["b", "c"]);
    const other = vi.fn();
    expect(
      selection.onItemKeydown({
        key: "x",
        preventDefault: other,
      } as unknown as KeyboardEvent),
    ).toBeNull();
    expect(other).not.toHaveBeenCalled();
  });

  it("set replaces the selection without announcing", () => {
    const announce = vi.fn();
    const selection = createSelection({ keys: order, announce });
    selection.set(["c", "d"]);
    expect(selection.toArray()).toEqual(["c", "d"]);
    expect(announce).not.toHaveBeenCalled();
  });

  it("works in tree mode and reports levels", () => {
    const selection = createSelection({
      keys: ["p", "c1", "c2"],
      tree: { nodes: [{ id: "p", nodes: [{ id: "c1" }, { id: "c2" }] }] },
    });
    selection.toggle("c1");
    expect(selection.keyLevel("p")).toBe("some");
    selection.toggle("p");
    expect(selection.toArray().sort()).toEqual(["c1", "c2", "p"]);
  });

  describe("announcements", () => {
    it("says how many are selected, on the selection's channel, debounced", () => {
      const announce = vi.fn();
      const selection = createSelection({ keys: order, announce, id: "files" });
      selection.select("a");
      selection.extendTo("c");
      expect(announce).toHaveBeenLastCalledWith("3 selected", {
        channel: "files",
        debounce: 250,
        dedupe: true,
      });
    });

    it("says nothing when nothing changed", () => {
      const announce = vi.fn();
      const selection = createSelection({ keys: order, announce });
      selection.select("a");
      announce.mockClear();
      selection.select("a");
      selection.clear();
      selection.clear();
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith(
        "Selection cleared",
        expect.anything(),
      );
    });

    it("says what a select all and a clear did", () => {
      const announce = vi.fn();
      const selection = createSelection({ keys: order, announce });
      selection.selectAll();
      expect(announce).toHaveBeenLastCalledWith(
        "6 selected",
        expect.anything(),
      );
      selection.toggle("a");
      expect(announce).toHaveBeenLastCalledWith(
        "5 selected",
        expect.anything(),
      );
    });

    it("counts selections a filter hides", () => {
      const announce = vi.fn();
      const selection = createSelection({
        keys: order,
        initial: ["a", "b"],
        announce,
      });
      selection.setKeys(["b", "c"]);
      selection.toggle("c");
      expect(announce).toHaveBeenLastCalledWith(
        "2 selected, 1 not shown",
        expect.anything(),
      );
    });

    it("takes its own texts and delay", () => {
      const announce = vi.fn();
      const selection = createSelection({
        keys: order,
        announce,
        announceDelay: 0,
        texts: {
          selected: (count) => `${count} Dateien`,
          cleared: () => "Leer",
        },
      });
      selection.select("a");
      expect(announce).toHaveBeenLastCalledWith(
        "1 Dateien",
        expect.objectContaining({ debounce: 0 }),
      );
      selection.clear();
      expect(announce).toHaveBeenLastCalledWith("Leer", expect.anything());
    });

    it("announces keyboard changes, and not a plain focus move", () => {
      const announce = vi.fn();
      const selection = createSelection({ keys: order, announce });
      selection.onItemFocus("a");
      const event = (key: string, extra = {}) =>
        ({ key, preventDefault() {}, ...extra }) as unknown as KeyboardEvent;
      selection.onItemKeydown(event("ArrowDown"));
      expect(announce).not.toHaveBeenCalled();
      selection.onItemKeydown(event("ArrowDown", { shiftKey: true }));
      expect(announce).toHaveBeenLastCalledWith(
        "2 selected",
        expect.anything(),
      );
      selection.onItemKeydown(event("Escape"));
      expect(announce).toHaveBeenLastCalledWith(
        "Selection cleared",
        expect.anything(),
      );
    });
  });

  it("moveFocus keeps the selection", () => {
    const state = moveFocus(createSelectionState(["a"]), "c");
    expect(picked(state)).toEqual(["a"]);
  });

  it("10,000 keys: a range across a sorted list is fast and exact", () => {
    const ids = Array.from({ length: 10_000 }, (_, index) => `row-${index}`);
    const selection = createSelection({ keys: () => ids });
    selection.select("row-100");
    const start = performance.now();
    selection.extendTo("row-9000");
    selection.selectAll();
    selection.toggle("row-5");
    const elapsed = performance.now() - start;
    expect(selection.toArray().length).toBe(9_999);
    expect(elapsed).toBeLessThan(250);
  });
});
