import {
  addUniqueArrayItem,
  toggleArrayItem,
} from "../../src/utils/array-set-ops.js";

describe("toggleArrayItem", () => {
  test("adds an item that is not present", () => {
    expect(toggleArrayItem(["a"], "b")).toEqual(["a", "b"]);
  });

  test("removes an item that is present", () => {
    expect(toggleArrayItem(["a", "b"], "a")).toEqual(["b"]);
  });

  test("adds to an empty array", () => {
    expect(toggleArrayItem([], "a")).toEqual(["a"]);
  });
});

describe("addUniqueArrayItem", () => {
  test("adds an item that is not present", () => {
    expect(addUniqueArrayItem(["a"], "b")).toEqual(["a", "b"]);
  });

  test("returns the same reference when the item is already present", () => {
    const array = ["a", "b"];
    expect(addUniqueArrayItem(array, "a")).toBe(array);
  });

  test("adds to an empty array", () => {
    expect(addUniqueArrayItem([], "a")).toEqual(["a"]);
  });
});
