import { addRecentQuery } from "carbon-components-svelte/Search/SearchRecent.svelte";

describe("addRecentQuery", () => {
  test("adds a new query to the front", () => {
    expect(addRecentQuery(["a"], "b")).toEqual(["b", "a"]);
  });

  test("moves a repeated query to the front instead of duplicating it", () => {
    expect(addRecentQuery(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
  });

  test("caps the result, dropping the oldest entries", () => {
    expect(addRecentQuery(["a", "b"], "c", { max: 2 })).toEqual(["c", "a"]);
  });

  test("returns queries unchanged for a falsy query", () => {
    const queries = ["a", "b"];
    expect(addRecentQuery(queries, "")).toBe(queries);
  });

  test("clamps a negative max to an empty array", () => {
    expect(addRecentQuery(["a"], "b", { max: -1 })).toEqual([]);
  });

  test("keeps every entry when max exceeds the length", () => {
    expect(addRecentQuery(["a"], "b", { max: 10 })).toEqual(["b", "a"]);
  });
});
