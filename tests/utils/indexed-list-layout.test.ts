import {
  buildIndexedLayout,
  getIndexedWindow,
  positionAt,
} from "../../src/utils/indexed-list-layout.js";

// Sections of 3, 0, 10 and 2 items; items 10px, headers 20px.
const layout = buildIndexedLayout([3, 0, 10, 2], 10, 20);

const keys = (rows: { key: string }[]) => rows.map((row) => row.key);

describe("buildIndexedLayout", () => {
  it("gives an empty section no header and no height", () => {
    expect(layout.offsets).toEqual([0, -1, 50, 170]);
    expect(layout.sections).toEqual([0, 2, 3]);
    expect(layout.total).toBe(50 + 120 + 40);
  });

  it("handles no items", () => {
    const empty = buildIndexedLayout([0, 0], 10, 20);
    expect(empty.total).toBe(0);
    expect(positionAt(empty, 0)).toBe(-1);
    expect(getIndexedWindow(empty, 0, 100, 10).rows).toEqual([]);
  });
});

describe("positionAt", () => {
  it("finds the last section starting at or above an offset", () => {
    expect(
      [0, 49, 50, 169, 170, 999].map((offset) => positionAt(layout, offset)),
    ).toEqual([0, 0, 1, 1, 2, 2]);
  });
});

describe("getIndexedWindow", () => {
  it("starts at the top with the first header and its items", () => {
    const window = getIndexedWindow(layout, 0, 40, 0);
    expect(keys(window.rows)).toEqual(["h0", "i0:0", "i0:1"]);
    expect(window.before).toBe(0);
    expect(window.section).toBe(0);
    expect(window.after).toBe(layout.total - 40);
  });

  it("covers the viewport and the overscan, and nothing else", () => {
    const window = getIndexedWindow(layout, 100, 30, 10);
    // 90 to 140 is items 2 to 6 of section 2, whose body starts at 70.
    expect(
      window.rows.filter((row) => row.type === "item").map((row) => row.key),
    ).toEqual(["i2:2", "i2:3", "i2:4", "i2:5", "i2:6"]);
    // Item 2 is at 90; the header that sticks takes the 20px above it.
    expect(window.before).toBe(70);
    expect(window.after).toBe(layout.total - 140);
  });

  it("reaches further the way the last scroll went, up to a viewport", () => {
    const items = (lead: number) =>
      getIndexedWindow(layout, 100, 30, 0, lead).rows.filter(
        (row) => row.type === "item",
      ).length;
    // 30px of viewport shows 3 items; 20px more ahead adds two.
    expect(items(0)).toBe(3);
    expect(items(20)).toBe(5);
    expect(items(-20)).toBe(5);
    // A lead past the viewport is a viewport.
    expect(items(500)).toBe(6);
  });

  it("keeps the header of the section at the top first, with room for it", () => {
    const window = getIndexedWindow(layout, 140, 20, 0);
    expect(window.section).toBe(2);
    expect(window.rows[0]).toMatchObject({
      type: "header",
      section: 2,
      key: "h2",
    });
    // The first item rendered sits at its own offset (50 + 20 + 7 * 10 = 140),
    // so the header above it takes the 20px before.
    expect(window.rows[1]).toMatchObject({ type: "item", index: 7 });
    expect(window.before).toBe(120);
  });

  it("does not repeat a header that is in the window", () => {
    const window = getIndexedWindow(layout, 45, 40, 10);
    const headers = window.rows.filter((row) => row.type === "header");
    expect(headers.map((row) => row.key)).toEqual(["h0", "h2"]);
    expect(new Set(keys(window.rows)).size).toBe(window.rows.length);
  });

  it("keeps the header at the top when it is in the window after other rows", () => {
    // Overscan reaches back into section 0, and section 2's header is in the window.
    const window = getIndexedWindow(layout, 52, 40, 20);
    expect(window.section).toBe(2);
    expect(keys(window.rows).filter((key) => key === "h2")).toHaveLength(1);
  });

  it("accounts for every pixel: before, the rows and after make the total", () => {
    for (const scrollTop of [0, 33, 51, 120, 169, 170, 205]) {
      const window = getIndexedWindow(layout, scrollTop, 45, 15);
      const height = window.rows.reduce(
        (sum, row) => sum + (row.type === "header" ? 20 : 10),
        0,
      );
      expect(window.before + height + window.after).toBe(layout.total);
    }
  });

  it("clamps a scroll position past the end to the last full viewport", () => {
    const window = getIndexedWindow(layout, 500, 50, 0);
    expect(window.section).toBe(2);
    expect(window.rows.at(-1)).toMatchObject({
      type: "item",
      section: 3,
      index: 1,
    });
    expect(window.after).toBe(0);
  });
});
