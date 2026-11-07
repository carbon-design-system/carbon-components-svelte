// @vitest-environment node
import {
  breakpointAt,
  compactLayout,
  layoutsEqual,
  moveLayoutItem,
  normalizeLayout,
  nudgeLayoutItem,
  placementStyles,
  reconcileLayout,
  resizeLayoutItem,
  resolveColumns,
  resolveLayouts,
  sortLayout,
} from "../../src/utils/dashboard-layout.js";

type Item = Parameters<typeof compactLayout>[0][number];

const opts = { cols: 4 };

function item(id: string, x: number, y: number, w: number, h: number): Item {
  return { id, x, y, w, h };
}

function at(layout: Item[], id: string) {
  const found = layout.find((i) => i.id === id);
  if (!found) throw new Error(`no ${id}`);
  return `${found.x},${found.y} ${found.w}x${found.h}`;
}

describe("normalizeLayout", () => {
  it("coerces bad numbers and keeps items inside the columns", () => {
    const [a, b] = normalizeLayout(
      [
        { id: "a", x: 9, y: -3, w: 99, h: 0 },
        { id: "b", x: Number.NaN, y: 1.6, w: 2.4, h: "x" as unknown as number },
      ],
      4,
    );
    expect(a).toEqual({ id: "a", x: 0, y: 0, w: 4, h: 1 });
    expect(b).toEqual({ id: "b", x: 0, y: 2, w: 2, h: 1 });
  });

  it("honors min and max sizes, and drops a repeated id", () => {
    const out = normalizeLayout(
      [
        { id: "a", x: 0, y: 0, w: 1, h: 9, minW: 2, maxH: 3 },
        { id: "a", x: 1, y: 1, w: 1, h: 1 },
      ],
      4,
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ w: 2, h: 3 });
  });
});

describe("compactLayout", () => {
  it("lifts items against the top and the item above", () => {
    const out = compactLayout(
      [item("a", 0, 5, 2, 2), item("b", 0, 9, 2, 1), item("c", 2, 7, 2, 1)],
      4,
    );
    expect(at(out, "a")).toBe("0,0 2x2");
    expect(at(out, "b")).toBe("0,2 2x1");
    expect(at(out, "c")).toBe("2,0 2x1");
  });

  it("separates overlapping items and keeps the order of the array", () => {
    const out = compactLayout(
      [item("a", 0, 0, 2, 2), item("b", 1, 1, 2, 2)],
      4,
    );
    expect(out.map((i) => i.id)).toEqual(["a", "b"]);
    expect(at(out, "b")).toBe("1,2 2x2");
  });

  it('leaves gaps with compact "none"', () => {
    const out = compactLayout(
      [item("a", 0, 3, 2, 1), item("b", 0, 3, 2, 1)],
      4,
      "none",
    );
    expect(at(out, "a")).toBe("0,3 2x1");
    expect(at(out, "b")).toBe("0,4 2x1");
  });

  it("flows around a static item", () => {
    const out = compactLayout(
      [
        { ...item("s", 0, 1, 4, 1), static: true },
        item("a", 0, 0, 4, 1),
        item("b", 0, 4, 4, 1),
      ],
      4,
    );
    expect(at(out, "s")).toBe("0,1 4x1");
    expect(at(out, "a")).toBe("0,0 4x1");
    expect(at(out, "b")).toBe("0,2 4x1");
  });
});

describe("moveLayoutItem", () => {
  const base = compactLayout(
    [item("a", 0, 0, 2, 2), item("b", 2, 0, 2, 2), item("c", 0, 2, 4, 1)],
    4,
  );

  it("pushes the items it lands on down", () => {
    const out = moveLayoutItem(base, "b", 0, 0, opts);
    expect(at(out, "b")).toBe("0,0 2x2");
    expect(at(out, "a")).toBe("0,2 2x2");
    expect(at(out, "c")).toBe("0,4 4x1");
  });

  it("does not change its input", () => {
    const before = JSON.stringify(base);
    moveLayoutItem(base, "b", 0, 0, opts);
    expect(JSON.stringify(base)).toBe(before);
  });

  it("swaps with the item below once it passes that item's top", () => {
    const stacked = compactLayout(
      [item("a", 0, 0, 4, 2), item("b", 0, 2, 4, 2)],
      4,
    );
    expect(
      layoutsEqual(moveLayoutItem(stacked, "a", 0, 2, opts), stacked),
    ).toBe(true);
    const out = moveLayoutItem(stacked, "a", 0, 3, opts);
    expect(at(out, "b")).toBe("0,0 4x2");
    expect(at(out, "a")).toBe("0,2 4x2");
  });

  it("clamps to the columns", () => {
    const out = moveLayoutItem(base, "a", 9, 0, { ...opts, compact: "none" });
    expect(at(out, "a")).toMatch(/^2,/);
  });

  it("returns the same array for a static item, a static target and prevent", () => {
    const withStatic = compactLayout(
      [{ ...item("s", 0, 0, 2, 2), static: true }, item("a", 2, 0, 2, 2)],
      4,
    );
    expect(moveLayoutItem(withStatic, "s", 2, 2, opts)).toBe(withStatic);
    expect(moveLayoutItem(withStatic, "a", 0, 0, opts)).toBe(withStatic);
    expect(
      moveLayoutItem(base, "b", 0, 0, { ...opts, collision: "prevent" }),
    ).toBe(base);
    expect(moveLayoutItem(base, "zzz", 0, 0, opts)).toBe(base);
  });
});

describe("resizeLayoutItem", () => {
  const base = compactLayout([item("a", 0, 0, 2, 1), item("b", 0, 1, 2, 1)], 4);

  it("pushes the items below down", () => {
    const out = resizeLayoutItem(base, "a", 2, 3, opts);
    expect(at(out, "a")).toBe("0,0 2x3");
    expect(at(out, "b")).toBe("0,3 2x1");
  });

  it("respects the limits and the columns to the end", () => {
    const limited = compactLayout(
      [{ ...item("a", 2, 0, 2, 1), maxW: 3, minH: 2, maxH: 2 }],
      4,
    );
    const out = resizeLayoutItem(limited, "a", 4, 9, opts);
    expect(at(out, "a")).toBe("2,0 2x2");
    expect(resizeLayoutItem(out, "a", 2, 2, opts)).toBe(out);
  });
});

describe("nudgeLayoutItem", () => {
  it("steps over the neighbour it swaps with", () => {
    const stacked = compactLayout(
      [item("a", 0, 0, 4, 2), item("b", 0, 2, 4, 2)],
      4,
    );
    const down = nudgeLayoutItem(stacked, "a", 0, 1, opts);
    expect(at(down, "a")).toBe("0,2 4x2");
    const up = nudgeLayoutItem(down, "a", 0, -1, opts);
    expect(layoutsEqual(up, stacked)).toBe(true);
  });

  it("returns the same array at an edge", () => {
    const one = compactLayout([item("a", 0, 0, 2, 2)], 4);
    expect(nudgeLayoutItem(one, "a", 0, -1, opts)).toBe(one);
    expect(nudgeLayoutItem(one, "a", 0, 1, opts)).toBe(one);
    expect(nudgeLayoutItem(one, "a", -1, 0, opts)).toBe(one);
    const right = nudgeLayoutItem(one, "a", 1, 0, opts);
    expect(at(right, "a")).toBe("1,0 2x2");
  });
});

describe("reconcileLayout", () => {
  const defaults = [item("a", 0, 0, 2, 2), item("b", 2, 0, 2, 2)];

  it("keeps stored places, drops unknown ids and adds new ones", () => {
    const out = reconcileLayout(
      [
        { id: "b", x: 0, y: 4, w: 3, h: 1 },
        { id: "gone", x: 0, y: 0, w: 1, h: 1 },
      ],
      defaults,
    );
    expect(out.map((i) => i.id)).toEqual(["a", "b"]);
    expect(at(out, "a")).toBe("0,0 2x2");
    expect(at(out, "b")).toBe("0,4 3x1");
  });

  it("ignores input that is not a layout", () => {
    expect(reconcileLayout("nope", defaults)).toEqual(defaults);
    expect(reconcileLayout([null, 3, { id: 4 }], defaults)).toEqual(defaults);
  });

  it("takes limits from the defaults", () => {
    const out = reconcileLayout(
      [{ id: "a", x: 0, y: 0, w: 9, h: 9, static: false }],
      [{ ...item("a", 0, 0, 2, 2), static: true, maxW: 3 }],
    );
    expect(out[0]).toMatchObject({ static: true, maxW: 3 });
  });
});

describe("sortLayout", () => {
  it("reads top to bottom, then start to end", () => {
    const out = sortLayout([
      item("c", 0, 1, 1, 1),
      item("b", 2, 0, 1, 1),
      item("a", 0, 0, 1, 1),
    ]);
    expect(out.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
});

describe("breakpoints", () => {
  it("picks the breakpoint the media queries would", () => {
    expect(breakpointAt(319)).toBe("sm");
    expect(breakpointAt(672)).toBe("md");
    expect(breakpointAt(1055)).toBe("md");
    expect(breakpointAt(1056)).toBe("lg");
    expect(breakpointAt(2000)).toBe("max");
  });

  it("gives every breakpoint the Carbon columns unless told otherwise", () => {
    expect(resolveColumns(undefined)).toEqual({
      sm: 4,
      md: 8,
      lg: 16,
      xlg: 16,
      max: 16,
    });
    expect(resolveColumns(12)).toEqual({
      sm: 12,
      md: 12,
      lg: 12,
      xlg: 12,
      max: 12,
    });
    expect(resolveColumns({ md: 6 }).md).toBe(6);
    expect(resolveColumns({ md: 6 }).lg).toBe(16);
  });

  it("derives a missing layout from the nearest larger one, then a smaller one", () => {
    const lg = [item("a", 0, 0, 8, 2), item("b", 8, 0, 8, 2)];
    const out = resolveLayouts({ lg }, resolveColumns(undefined));
    // Narrower: fitted and stacked.
    expect(at(out.sm, "b")).toBe("0,2 4x2");
    expect(at(out.md, "b")).toBe("0,2 8x2");
    // Wider: the given layout, as it is.
    expect(out.max).toEqual(lg);

    const onlySm = resolveLayouts(
      { sm: [item("a", 0, 0, 4, 1)] },
      resolveColumns(undefined),
    );
    expect(at(onlySm.max, "a")).toBe("0,0 4x1");
  });

  it("leaves a given layout as it is", () => {
    const given = [item("a", 0, 5, 2, 1)];
    expect(
      at(resolveLayouts({ md: given }, resolveColumns(undefined)).md, "a"),
    ).toBe("0,5 2x1");
  });

  it("writes a custom property only where the cell changes", () => {
    const lists = resolveLayouts(
      { sm: [item("a", 0, 0, 4, 1)], lg: [item("a", 4, 0, 4, 1)] },
      resolveColumns(undefined),
    );
    // md takes the layout of lg, the nearest larger one, and the wider
    // breakpoints that match it carry nothing.
    expect(placementStyles(lists).get("a")).toBe(
      "--ccs-dg-sm:1 / 1 / span 1 / span 4;--ccs-dg-md:1 / 5 / span 1 / span 4;",
    );
  });
});
