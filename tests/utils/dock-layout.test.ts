import {
  activate,
  addDockTab as add,
  closeDockTab as close,
  dockTab as dock,
  fitSizes,
  groups,
  layoutRects,
  moveDockTab as move,
  neighbor,
  normalizeDockLayout as normalize,
  parseDockLayout as parse,
  reconcileDockLayout as reconcile,
  resize,
  splitDockTab as split,
  tabIds,
} from "../../src/utils/dock-layout.js";
import type { DockNode } from "../../src/utils/dock-layout.js";

const group = (id: string, tabs: string[], activeId = tabs[0]): DockNode => ({
  type: "group",
  id,
  tabs,
  activeId,
});

/** A row of two groups: a, b | c. */
const row = (): DockNode => ({
  type: "row",
  children: [group("group-1", ["a", "b"]), group("group-2", ["c"])],
  sizes: [60, 40],
});

/** The layout as `tabs/tabs` text, so a shape reads at a glance. */
const shape = (node: DockNode): string =>
  node.type === "group"
    ? `[${node.tabs.join("")}]`
    : `${node.type === "row" ? "R" : "C"}(${node.children.map(shape).join(" ")})`;

describe("fitSizes", () => {
  it("scales sizes to 100 and keeps a fitting array as it is", () => {
    expect(fitSizes([1, 1, 2], 3)).toEqual([25, 25, 50]);
    const fit = [30, 70];
    expect(fitSizes(fit, 2)).toBe(fit);
  });

  it("falls back to equal shares for bad sizes", () => {
    expect(fitSizes([0, 100], 2)).toEqual([50, 50]);
    expect(fitSizes([10], 2)).toEqual([50, 50]);
    expect(fitSizes(undefined, 3)).toEqual([33.33, 33.33, 33.34]);
  });
});

describe("normalize", () => {
  it("returns a valid layout as it is", () => {
    const layout = row();
    expect(normalize(layout)).toBe(layout);
  });

  it("drops unknown tabs and repeats, and collapses the groups they empty", () => {
    const layout = normalize(row(), { known: ["a", "c"] });
    expect(shape(layout)).toBe("R([a] [c])");
    const repeated = normalize({
      type: "row",
      children: [group("group-1", ["a"]), group("group-2", ["a", "b"])],
      sizes: [50, 50],
    });
    expect(shape(repeated)).toBe("R([a] [b])");
  });

  it("gives the space of a collapsed group to its siblings", () => {
    const layout = normalize({
      type: "row",
      children: [group("a", ["x"]), group("b", []), group("c", ["y"])],
      sizes: [20, 50, 30],
    });
    expect(layout.type === "row" && layout.sizes).toEqual([40, 60]);
  });

  it("unwraps a split of one and merges a split into its own kind", () => {
    const layout = normalize({
      type: "row",
      children: [
        {
          type: "row",
          children: [group("group-1", ["a"]), group("group-2", ["b"])],
          sizes: [50, 50],
        },
        group("group-3", ["c"]),
      ],
      sizes: [50, 50],
    });
    expect(shape(layout)).toBe("R([a] [b] [c])");
    expect(layout.type === "row" && layout.sizes).toEqual([25, 25, 50]);
    expect(
      shape(
        normalize({
          type: "column",
          children: [group("group-1", ["a"])],
          sizes: [100],
        }),
      ),
    ).toBe("[a]");
  });

  it("repairs the active tab and gives a group without an id one", () => {
    const layout = normalize({
      type: "group",
      tabs: ["a", "b"],
      activeId: "gone",
    });
    expect(layout).toEqual({
      type: "group",
      id: "group-1",
      tabs: ["a", "b"],
      activeId: "a",
    });
    const twins = normalize({
      type: "row",
      children: [group("g", ["a"]), group("g", ["b"])],
      sizes: [50, 50],
    });
    const ids = groups(twins).map((g) => g.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("keeps one empty group when no tab is left", () => {
    expect(normalize(group("main", []))).toEqual({
      type: "group",
      id: "main",
      tabs: [],
    });
    expect(normalize(row(), { known: [] })).toMatchObject({
      type: "group",
      id: "group-1",
      tabs: [],
    });
    expect(normalize("nonsense")).toMatchObject({ type: "group", tabs: [] });
  });
});

describe("close", () => {
  it("makes the next tab active when the active one closes", () => {
    const layout = close(group("g", ["a", "b", "c"], "b"), "b");
    expect(layout).toMatchObject({ tabs: ["a", "c"], activeId: "c" });
    expect(close(group("g", ["a", "b"], "b"), "b")).toMatchObject({
      activeId: "a",
    });
  });

  it("collapses a group when its last tab closes", () => {
    expect(shape(close(row(), "c"))).toBe("[ab]");
    const layout = row();
    expect(close(layout, "none")).toBe(layout);
  });

  it("leaves one empty group when the last tab of all closes", () => {
    expect(close(group("g", ["a"]), "a")).toEqual({
      type: "group",
      id: "g",
      tabs: [],
    });
  });
});

describe("move", () => {
  it("joins another group at an index and makes the tab active", () => {
    const layout = move(row(), "c", "group-1", 1);
    expect(shape(layout)).toBe("[acb]");
    expect(layout).toMatchObject({ activeId: "c" });
  });

  it("collapses the group it leaves", () => {
    expect(shape(move(row(), "a", "group-2"))).toBe("R([b] [ca])");
    expect(shape(move(row(), "c", "group-1"))).toBe("[abc]");
  });

  it("reorders within a group, counting the tab as already out", () => {
    const layout = group("g", ["a", "b", "c"]);
    expect(move(layout, "a", "g", 2)).toMatchObject({ tabs: ["b", "c", "a"] });
    expect(move(layout, "c", "g", 0)).toMatchObject({ tabs: ["c", "a", "b"] });
  });

  it("returns the layout when nothing changes", () => {
    const layout = group("g", ["a", "b"], "a");
    expect(move(layout, "a", "g", 0)).toBe(layout);
    expect(move(layout, "a", "missing")).toBe(layout);
    expect(move(layout, "missing", "g")).toBe(layout);
  });

  it("shares the groups it did not touch", () => {
    const layout: DockNode = {
      type: "row",
      children: [
        group("g1", ["a", "b"]),
        group("g2", ["c"]),
        group("g3", ["d"]),
      ],
      sizes: [30, 30, 40],
    };
    const next = move(layout, "b", "g2");
    if (layout.type !== "row" || next.type !== "row") throw new Error();
    expect(next.children[2]).toBe(layout.children[2]);
  });
});

describe("split", () => {
  it("splits a group on an edge with the tab in a new group", () => {
    const layout = split(group("group-1", ["a", "b"]), "b", "group-1", "end");
    expect(shape(layout)).toBe("R([a] [b])");
    expect(layout.type === "row" && layout.sizes).toEqual([50, 50]);
    expect(
      split(group("group-1", ["a", "b"]), "b", "group-1", "top"),
    ).toMatchObject({
      type: "column",
      children: [{ tabs: ["b"] }, { tabs: ["a"] }],
    });
  });

  it("puts the new group before the target on the start and top edges", () => {
    const layout = split(group("group-1", ["a", "b"]), "b", "group-1", "start");
    expect(shape(layout)).toBe("R([b] [a])");
  });

  it("takes half of the target's share when the split runs that way", () => {
    const layout = split(row(), "a", "group-2", "end");
    expect(shape(layout)).toBe("R([b] [c] [a])");
    expect(layout.type === "row" && layout.sizes).toEqual([60, 20, 20]);
  });

  it("nests a split across the target's direction", () => {
    const layout = split(row(), "a", "group-2", "bottom");
    expect(shape(layout)).toBe("R([b] C([c] [a]))");
  });

  it("will not split a group's only tab from itself", () => {
    const layout = group("g", ["a"]);
    expect(split(layout, "a", "g", "end")).toBe(layout);
  });

  it("collapses the group it empties, as the new group arrives", () => {
    // `c` leaves group-2 and splits group-1: the row it was in collapses.
    const layout = split(row(), "c", "group-1", "bottom");
    expect(shape(layout)).toBe("C([ab] [c])");
  });

  it("numbers a new group past the largest in use", () => {
    const layout = split(row(), "a", "group-1", "end");
    expect(
      groups(layout)
        .map((g) => g.id)
        .sort(),
    ).toEqual(["group-1", "group-2", "group-3"]);
  });
});

describe("dock", () => {
  it("joins on the center and splits on an edge", () => {
    expect(shape(dock(row(), "c", "group-1", "center"))).toBe("[abc]");
    expect(shape(dock(row(), "a", "group-2", "top"))).toBe("R([b] C([a] [c]))");
  });
});

describe("add", () => {
  it("opens a tab in the first group, or the one named, and activates it", () => {
    expect(shape(add(row(), "d"))).toBe("R([abd] [c])");
    expect(groups(add(row(), "d"))[0].activeId).toBe("d");
    expect(shape(add(row(), "d", "group-2"))).toBe("R([ab] [cd])");
    expect(shape(add(row(), "d", "nowhere"))).toBe("R([abd] [c])");
  });

  it("activates a tab the layout already holds, where it is", () => {
    const layout = add(row(), "c");
    expect(shape(layout)).toBe("R([ab] [c])");
    expect(add(row(), "a")).toEqual(row());
  });
});

describe("activate and resize", () => {
  it("activates a tab in its own group", () => {
    const layout = row();
    expect(activate(layout, "b")).not.toBe(layout);
    expect(groups(activate(layout, "b"))[0].activeId).toBe("b");
    expect(activate(layout, "a")).toBe(layout);
  });

  it("sets the sizes of the split at a path and rescales them", () => {
    const layout: DockNode = {
      type: "column",
      children: [group("g1", ["a"]), row()],
      sizes: [50, 50],
    };
    const next = resize(layout, [1], [1, 3]);
    if (next.type !== "column") throw new Error();
    expect(next.children[1]).toMatchObject({ sizes: [25, 75] });
    expect(next.children[0]).toBe(layout.children[0]);
    expect(resize(layout, [], [10, 90])).toMatchObject({ sizes: [10, 90] });
    expect(resize(layout, [], [10])).toBe(layout);
  });
});

describe("neighbor", () => {
  /** Three columns, the middle one split in two rows. */
  const layout: DockNode = {
    type: "row",
    children: [
      group("left", ["a"]),
      {
        type: "column",
        children: [group("top", ["b"]), group("bottom", ["c"])],
        sizes: [50, 50],
      },
      group("right", ["d"]),
    ],
    sizes: [25, 50, 25],
  };

  it("finds the group beside it along a row and a column", () => {
    expect(neighbor(layout, "left", "end")).toBe("top");
    expect(neighbor(layout, "right", "start")).toBe("top");
    expect(neighbor(layout, "top", "down")).toBe("bottom");
    expect(neighbor(layout, "bottom", "up")).toBe("top");
    expect(neighbor(layout, "bottom", "start")).toBe("left");
  });

  it("is undefined at an edge of the layout", () => {
    expect(neighbor(layout, "left", "start")).toBeUndefined();
    expect(neighbor(layout, "top", "up")).toBeUndefined();
    expect(neighbor(layout, "nope", "end")).toBeUndefined();
  });

  it("keeps to the row it is in across a 4 by 4 grid", () => {
    const column = (c: number): DockNode => ({
      type: "column",
      children: [1, 2, 3, 4].map((r) => group(`r${r}c${c}`, [`t${r}${c}`])),
      sizes: [25, 25, 25, 25],
    });
    const grid: DockNode = {
      type: "row",
      children: [1, 2, 3, 4].map(column),
      sizes: [25, 25, 25, 25],
    };
    expect(neighbor(grid, "r3c1", "end")).toBe("r3c2");
    expect(neighbor(grid, "r3c4", "start")).toBe("r3c3");
    expect(neighbor(grid, "r4c2", "up")).toBe("r3c2");
  });
});

describe("layoutRects", () => {
  it("works the rectangles out from the sizes", () => {
    const rects = layoutRects(split(row(), "a", "group-2", "bottom"));
    expect(rects.get("group-1")).toEqual({ x: 0, y: 0, w: 60, h: 100 });
    expect(rects.get("group-2")).toEqual({ x: 60, y: 0, w: 40, h: 50 });
    expect(rects.get("group-3")).toEqual({ x: 60, y: 50, w: 40, h: 50 });
  });
});

describe("reconcile and parse", () => {
  it("drops tabs that are gone and adds tabs the layout does not hold", () => {
    const layout = reconcile(row(), ["a", "c", "d"]);
    expect(shape(layout)).toBe("R([ad] [c])");
    expect(tabIds(layout)).toEqual(["a", "d", "c"]);
    const second = reconcile(row(), ["a", "c", "d"], { groupId: "group-2" });
    expect(shape(second)).toBe("R([a] [cd])");
  });

  it("round-trips a layout through text", () => {
    const layout = split(row(), "a", "group-2", "end");
    expect(parse(JSON.stringify(layout))).toEqual(layout);
  });

  it("repairs what it reads and gives up on text that is not JSON", () => {
    expect(parse("{")).toBeUndefined();
    expect(parse(null)).toBeUndefined();
    expect(
      shape(parse(JSON.stringify(row()), { known: ["b", "c"] }) as DockNode),
    ).toBe("R([b] [c])");
    expect(parse("42")).toMatchObject({ type: "group", tabs: [] });
  });
});
