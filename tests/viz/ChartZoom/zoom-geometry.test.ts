import { buildGroups } from "../../../src/viz/Chart/model.js";
import {
  clampWindow,
  overviewPath,
} from "../../../src/viz/Chart/zoom-geometry.js";

const full: [number, number] = [0, 100];

describe("clampWindow", () => {
  test("moves one edge and keeps it inside the whole", () => {
    expect(clampWindow(-20, 60, full, 5, "start")).toEqual([0, 60]);
    expect(clampWindow(20, 140, full, 5, "end")).toEqual([20, 100]);
  });

  test("pushes the other edge along instead of crossing it", () => {
    expect(clampWindow(70, 60, full, 5, "start")).toEqual([70, 75]);
    expect(clampWindow(40, 30, full, 5, "end")).toEqual([25, 30]);
  });

  test("never gets narrower than the minimum, even at an end", () => {
    expect(clampWindow(99, 100, full, 5, "start")).toEqual([95, 100]);
    expect(clampWindow(0, 1, full, 5, "end")).toEqual([0, 5]);
  });

  test("pans with its width kept, stopping at either end", () => {
    expect(clampWindow(30, 50, full, 5)).toEqual([30, 50]);
    expect(clampWindow(-10, 10, full, 5)).toEqual([0, 20]);
    expect(clampWindow(95, 115, full, 5)).toEqual([80, 100]);
  });
});

describe("overviewPath", () => {
  const built = buildGroups(
    [
      { x: 0, y: 10, s: "a" },
      { x: 50, y: 30, s: "a" },
      { x: 100, y: 20, s: "a" },
      { x: 50, y: 10, s: "b" },
      { x: 100, y: null, s: "b" },
    ],
    {
      x: (row) => row.x,
      y: (row) => row.y,
      series: (row) => row.s,
    },
  );
  const box = { x0: 40, x1: 440, height: 32 };

  test("draws the total across series over the whole range", () => {
    const path = overviewPath(built.groups, full, box);

    expect(path.startsWith("M40,")).toBe(true);
    // The tallest total, 30 + 10 at x 50, reaches the top, 2 pixels in.
    expect(path).toContain("240,2");
    expect(path).toContain("440,");
  });

  test("leaves hidden series out", () => {
    const groups = built.groups.map((group) =>
      group.key === "b" ? { ...group, hidden: true } : group,
    );

    expect(overviewPath(groups, full, box)).not.toBe(
      overviewPath(built.groups, full, box),
    );
  });

  test("is empty when there is nothing to show", () => {
    expect(overviewPath([], full, box)).toBe("");
    expect(overviewPath(built.groups, [5, 5], box)).toBe("");
  });
});
