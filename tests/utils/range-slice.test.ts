// @vitest-environment node
import { rangeSlice } from "../../src/utils/range-slice.js";

const items = ["a", "b", "c", "d", "e"];

describe("rangeSlice", () => {
  it("returns the inclusive range in list order", () => {
    expect(rangeSlice(items, 1, 3)).toEqual(["b", "c", "d"]);
  });

  it("handles a target before the anchor", () => {
    expect(rangeSlice(items, 3, 1)).toEqual(["b", "c", "d"]);
  });

  it("returns the single item when anchor equals target", () => {
    expect(rangeSlice(items, 2, 2)).toEqual(["c"]);
  });

  it("filters out ineligible items", () => {
    expect(rangeSlice(items, 0, 4, (item) => item !== "c")).toEqual([
      "a",
      "b",
      "d",
      "e",
    ]);
  });

  it("returns null when the anchor is missing", () => {
    expect(rangeSlice(items, -1, 2)).toBeNull();
  });
});
