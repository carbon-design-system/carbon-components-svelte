// @vitest-environment node
import {
  addUniqueArrayItem,
  sameArrayItems,
  sameItemSet,
  toggleArrayItem,
} from "../../src/utils/array-set-ops.js";

describe("toggleArrayItem", () => {
  it("adds an item that is not present", () => {
    expect(toggleArrayItem(["a"], "b")).toEqual(["a", "b"]);
  });

  it("removes an item that is present", () => {
    expect(toggleArrayItem(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("addUniqueArrayItem", () => {
  it("adds an item that is not present", () => {
    expect(addUniqueArrayItem(["a"], "b")).toEqual(["a", "b"]);
  });

  it("returns the same reference when the item is already present", () => {
    const array = ["a", "b"];
    expect(addUniqueArrayItem(array, "a")).toBe(array);
  });
});

describe("sameArrayItems", () => {
  it("compares items in order, not the array reference", () => {
    const array = ["a", "b"];
    const before = [...array];
    array.splice(0, 2, "b", "a");

    expect(sameArrayItems(array, before)).toBe(false);
    expect(sameArrayItems(array, ["b", "a"])).toBe(true);
    expect(sameArrayItems([], [])).toBe(true);
  });
});

describe("sameItemSet", () => {
  it("ignores order but not a duplicate standing in for another item", () => {
    expect(sameItemSet(["b", "a"], new Set(["a", "b"]))).toBe(true);
    expect(sameItemSet(["a", "a"], new Set(["a", "b"]))).toBe(false);
    expect(sameItemSet(["a", "a", "b"], new Set(["a", "b"]))).toBe(true);
  });
});
