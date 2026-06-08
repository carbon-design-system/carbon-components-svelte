import { typeaheadIndex } from "../../src/utils/typeahead.js";

describe("typeaheadIndex", () => {
  const fruits = ["Apple", "Apricot", "Banana", "Cherry"].map((text, id) => ({
    id,
    text,
    disabled: false,
  }));
  const itemToString = (item: { text: string }) => item.text;

  test("finds the next prefix match after the current index", () => {
    expect(
      typeaheadIndex({ items: fruits, query: "a", itemToString, index: 0 }),
    ).toBe(1);
  });

  test("finds a match from the start when index is -1", () => {
    expect(
      typeaheadIndex({ items: fruits, query: "b", itemToString, index: -1 }),
    ).toBe(2);
  });

  test("wraps to the first prefix match after the end", () => {
    expect(
      typeaheadIndex({ items: fruits, query: "a", itemToString, index: 3 }),
    ).toBe(0);
  });

  test("matches a multi-character prefix", () => {
    expect(
      typeaheadIndex({ items: fruits, query: "apr", itemToString, index: -1 }),
    ).toBe(1);
  });

  test("is case-insensitive", () => {
    expect(
      typeaheadIndex({ items: fruits, query: "B", itemToString, index: -1 }),
    ).toBe(2);
  });

  test("skips disabled items", () => {
    const items = [
      { text: "Banana", disabled: true },
      { text: "Blueberry", disabled: false },
    ];
    expect(typeaheadIndex({ items, query: "b", itemToString, index: -1 })).toBe(
      1,
    );
  });

  test("returns the original index when nothing matches", () => {
    expect(
      typeaheadIndex({ items: fruits, query: "z", itemToString, index: 2 }),
    ).toBe(2);
  });

  test("returns the original index for an empty query", () => {
    expect(
      typeaheadIndex({ items: fruits, query: "", itemToString, index: 1 }),
    ).toBe(1);
  });

  test("returns the original index for empty items", () => {
    expect(
      typeaheadIndex({ items: [], query: "a", itemToString, index: -1 }),
    ).toBe(-1);
  });

  test("supports a custom isDisabled predicate", () => {
    const items = [
      { label: "Alpha", ok: false },
      { label: "Apex", ok: true },
    ];
    expect(
      typeaheadIndex({
        items,
        query: "a",
        itemToString: (item) => item.label,
        index: -1,
        isDisabled: (item) => !item.ok,
      }),
    ).toBe(1);
  });
});
