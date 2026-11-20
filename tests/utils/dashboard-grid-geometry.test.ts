// @vitest-environment node
import {
  cellAt,
  cellSpan,
  edgeScrollSpeed,
  parseTrackSizes,
} from "../../src/utils/dashboard-grid-geometry.js";

describe("parseTrackSizes", () => {
  it("reads the resolved tracks of a computed grid", () => {
    expect(parseTrackSizes("63px 63px 63.5px")).toEqual([63, 63, 63.5]);
    expect(parseTrackSizes("none")).toEqual([]);
    expect(parseTrackSizes("")).toEqual([]);
  });
});

describe("cellAt and cellSpan", () => {
  // 64px cells with a 16px gap.
  it("finds the nearest cell, within the columns", () => {
    expect(cellAt(0, 80, 16)).toBe(0);
    expect(cellAt(39, 80, 16)).toBe(0);
    expect(cellAt(41, 80, 16)).toBe(1);
    expect(cellAt(-200, 80, 16)).toBe(0);
    expect(cellAt(5000, 80, 4)).toBe(3);
    expect(cellAt(5000, 80, Number.POSITIVE_INFINITY)).toBe(63);
  });

  it("counts the cells a size covers, gaps included", () => {
    expect(cellSpan(64, 64, 16)).toBe(1);
    expect(cellSpan(144, 64, 16)).toBe(2);
    expect(cellSpan(10, 64, 16)).toBe(1);
    expect(cellSpan(300, 64, 16)).toBe(4);
  });
});

describe("edgeScrollSpeed", () => {
  const area = { start: 0, end: 600 };

  it("is zero away from the edges and signed toward them", () => {
    expect(edgeScrollSpeed({ ...area, pointer: 300 })).toBe(0);
    expect(edgeScrollSpeed({ ...area, pointer: 10 })).toBeLessThan(0);
    expect(edgeScrollSpeed({ ...area, pointer: 590 })).toBeGreaterThan(0);
  });

  it("ramps up while the pointer stays at the edge", () => {
    const brief = edgeScrollSpeed({ ...area, pointer: 590, held: 0 });
    const held = edgeScrollSpeed({ ...area, pointer: 590, held: 400 });
    expect(held).toBeGreaterThan(brief * 4);
  });
});
