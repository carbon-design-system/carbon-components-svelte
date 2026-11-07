import { countTracks, placeMasonry, snap } from "../../src/utils/masonry.js";

describe("placeMasonry", () => {
  it("puts each item in the shortest column, the first one on a tie", () => {
    const { column, top, height } = placeMasonry([100, 50, 80, 30], 2, 10);

    expect(column).toEqual([0, 1, 1, 0]);
    expect(top).toEqual([0, 0, 60, 110]);
    expect(height).toBe(140);
  });

  it("keeps the tops in the order of the items, whatever the heights", () => {
    let seed = 11;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (const columns of [1, 2, 3, 5, 8]) {
      const heights = Array.from({ length: 200 }, () => 20 + random() * 300);
      const { top, column } = placeMasonry(heights, columns, 16);
      for (let i = 1; i < top.length; i++) {
        const after =
          top[i] > top[i - 1] ||
          (top[i] === top[i - 1] && column[i] > column[i - 1]);
        expect(after, `item ${i} of ${columns} columns`).toBe(true);
      }
    }
  });

  it("ties columns that are equal to the 1/64 px", () => {
    // 0.1 + 0.2 differs from 0.3 in floating point; the layout rounds both.
    const { column } = placeMasonry([0.1, 0.1, 0.2, 0.3, 50], 2, 0);

    expect(column.slice(0, 2)).toEqual([0, 1]);
    expect(snap(0.1 + 0.2)).toBe(snap(0.3));
  });

  it("returns an empty layout for no items and one column for a bad count", () => {
    expect(placeMasonry([], 3, 8)).toEqual({ column: [], top: [], height: 0 });
    expect(placeMasonry([10, 10], 0, 0).column).toEqual([0, 0]);
  });
});

describe("countTracks", () => {
  it("counts the tracks, not the line names", () => {
    expect(countTracks("180px 180px 180.5px")).toBe(3);
    expect(countTracks("[a] 100px [b] 100px [c]")).toBe(2);
  });

  it("is one track for no template", () => {
    expect(countTracks("none")).toBe(1);
    expect(countTracks("")).toBe(1);
  });
});
