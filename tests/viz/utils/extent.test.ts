import { extent, extentBy } from "../../../src/viz/utils/extent.js";

describe("extent", () => {
  test("returns [min, max] of finite values", () => {
    expect(extent([3, 1, 2])).toEqual([1, 3]);
  });

  test("skips null, undefined, NaN, and Infinity", () => {
    expect(
      extent([
        1,
        null,
        undefined,
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        5,
      ]),
    ).toEqual([1, 5]);
  });

  test("converts Dates to epoch milliseconds", () => {
    const a = new Date(2020, 0, 1);
    const b = new Date(2021, 0, 1);
    expect(extent([a, b])).toEqual([+a, +b]);
  });

  test("returns null when nothing is finite", () => {
    expect(
      extent([null, undefined, Number.NaN, Number.POSITIVE_INFINITY]),
    ).toBeNull();
  });

  test("returns null for empty input", () => {
    expect(extent([])).toBeNull();
  });
});

describe("extentBy", () => {
  test("reads each value through the accessor", () => {
    const rows = [{ v: 3 }, { v: 1 }, { v: 2 }];
    expect(extentBy(rows, (row) => row.v)).toEqual([1, 3]);
  });

  test("skips null, undefined, NaN, and Infinity from the accessor", () => {
    const rows = [1, null, undefined, Number.NaN, Number.POSITIVE_INFINITY, 5];
    expect(extentBy(rows, (row) => row)).toEqual([1, 5]);
  });

  test("converts Dates returned by the accessor to epoch milliseconds", () => {
    const a = new Date(2020, 0, 1);
    const b = new Date(2021, 0, 1);
    expect(extentBy([a, b], (row) => row)).toEqual([+a, +b]);
  });

  test("returns null when nothing is finite", () => {
    expect(extentBy([null, undefined, Number.NaN], (row) => row)).toBeNull();
  });

  test("returns null for empty input", () => {
    expect(extentBy([], (row) => row)).toBeNull();
  });

  test("passes the index to the accessor", () => {
    const indices: number[] = [];
    extentBy([10, 20, 30], (row, i) => {
      indices.push(i);
      return row;
    });
    expect(indices).toEqual([0, 1, 2]);
  });
});
