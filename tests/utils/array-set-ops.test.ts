// @vitest-environment node
import {
  addUniqueArrayItem,
  toggleArrayItem,
} from "../../src/utils/array-set-ops.js";

describe("toggleArrayItem", () => {
  it("adds an item that is not present", () => {
    expect(toggleArrayItem(["a"], "b")).toEqual(["a", "b"]);
  });

  it("removes an item that is present", () => {
    expect(toggleArrayItem(["a", "b"], "a")).toEqual(["b"]);
  });

  it("adds to an empty array", () => {
    expect(toggleArrayItem([], "a")).toEqual(["a"]);
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

  it("adds to an empty array", () => {
    expect(addUniqueArrayItem([], "a")).toEqual(["a"]);
  });
});
