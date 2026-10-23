import { categoricalColors, vizColor } from "../../../src/viz/utils/tokens.js";

describe("vizColor", () => {
  test("semantic names become var() references", () => {
    expect(vizColor("interactive")).toBe("var(--cds-viz-interactive)");
    expect(vizColor("error")).toBe("var(--cds-viz-error)");
  });

  test.each([
    [1, "var(--cds-viz-cat-01)"],
    [14, "var(--cds-viz-cat-14)"],
    [15, "var(--cds-viz-cat-01)"],
    [0, "var(--cds-viz-cat-14)"],
  ])("vizColor(%i) === %s", (n, expected) => {
    expect(vizColor(n)).toBe(expected);
  });

  test("negative indices cycle", () => {
    expect(vizColor(-13)).toBe(vizColor(1));
    expect(vizColor(-13)).toBe("var(--cds-viz-cat-01)");
  });

  test("non-finite numbers return undefined", () => {
    expect(vizColor(Number.NaN)).toBeUndefined();
    expect(vizColor(Number.POSITIVE_INFINITY)).toBeUndefined();
  });

  test("token names become var() references", () => {
    expect(vizColor("cat-03")).toBe("var(--cds-viz-cat-03)");
    expect(vizColor("seq-blue-05")).toBe("var(--cds-viz-seq-blue-05)");
    expect(vizColor("group-2-1-1")).toBe("var(--cds-viz-group-2-1-1)");
    expect(vizColor("div-red-cyan-09")).toBe("var(--cds-viz-div-red-cyan-09)");
  });

  test("an arbitrary CSS color passes through untouched", () => {
    expect(vizColor("#ff0000")).toBe("#ff0000");
    expect(vizColor("red")).toBe("red");
  });

  test("empty string, null, and undefined return undefined", () => {
    expect(vizColor("")).toBeUndefined();
    expect(vizColor(null)).toBeUndefined();
    expect(vizColor(undefined)).toBeUndefined();
  });
});

describe("categoricalColors", () => {
  test.each([1, 2, 3, 4, 5])(
    "sizes 1..5 use group tokens (size %i)",
    (size) => {
      const colors = categoricalColors(size);
      expect(colors).toHaveLength(size);
      for (let i = 0; i < size; i++) {
        expect(colors[i]).toBe(`var(--cds-viz-group-${size}-1-${i + 1})`);
      }
    },
  );

  test("option wraps: option 6 for size 2 behaves like option 1", () => {
    expect(categoricalColors(2, 6)).toEqual(categoricalColors(2, 1));
  });

  test("0 returns an empty array", () => {
    expect(categoricalColors(0)).toEqual([]);
  });

  test("6 uses the first six categorical tokens", () => {
    expect(categoricalColors(6)).toEqual([
      "var(--cds-viz-cat-01)",
      "var(--cds-viz-cat-02)",
      "var(--cds-viz-cat-03)",
      "var(--cds-viz-cat-04)",
      "var(--cds-viz-cat-05)",
      "var(--cds-viz-cat-06)",
    ]);
  });

  test("more than 14 cycles back through the categorical tokens", () => {
    const colors = categoricalColors(16);
    expect(colors[14]).toBe("var(--cds-viz-cat-01)");
    expect(colors[15]).toBe("var(--cds-viz-cat-02)");
  });
});
