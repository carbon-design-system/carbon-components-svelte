import { splitAt } from "../../../src/viz/Chart/line-geometry.js";
import { buildGroups } from "../../../src/viz/Chart/model.js";

const rows = [0, 1, 2, 3, 4].map((day) => ({ day, value: day * 10 }));
const [group] = buildGroups(rows, {
  x: (row) => row.day,
  y: (row) => row.value,
  series: () => "s",
}).groups;

describe("splitAt", () => {
  test("shares the datum at the cut so the halves meet", () => {
    const { before, after } = splitAt(group, 2);
    expect(before?.xs).toEqual([0, 1, 2]);
    expect(after?.xs).toEqual([2, 3, 4]);
    expect(after?.rows[0]).toBe(rows[2]);
  });

  test("cuts between data without inventing a point", () => {
    const { before, after } = splitAt(group, 2.5);
    expect(before?.xs).toEqual([0, 1, 2]);
    expect(after?.xs).toEqual([3, 4]);
  });

  test("a half of fewer than two points is null", () => {
    expect(splitAt(group, 0).before).toBeNull();
    expect(splitAt(group, 4).after).toBeNull();
    expect(splitAt(group, 9).before?.xs).toEqual([0, 1, 2, 3, 4]);
    expect(splitAt(group, 9).after).toBeNull();
  });
});
