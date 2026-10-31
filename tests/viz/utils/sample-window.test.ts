import { appendWindow } from "../../../src/viz/utils/sample-window.js";

describe("appendWindow", () => {
  test("appends, and keeps only the last max rows", () => {
    const rows = [1, 2, 3];
    expect(appendWindow(rows, [4])).toEqual([1, 2, 3, 4]);
    expect(appendWindow(rows, [4, 5], 4)).toEqual([2, 3, 4, 5]);
    expect(rows).toEqual([1, 2, 3]);
  });
});
