import { groupItems } from "../../src/utils/groupItems.js";

describe("groupItems", () => {
  test("keeps each group's items contiguous in first-seen group order", () => {
    const items = [
      { id: 0, group: "Fruits" },
      { id: 1, group: "Vegetables" },
      { id: 2, group: "Fruits" },
      { id: 3, group: "Vegetables" },
    ];

    expect(groupItems(items).map((item) => item.id)).toEqual([0, 2, 1, 3]);
  });

  test("sorts within a group with the comparator, not across groups", () => {
    const items = [
      { id: "b", text: "Banana", group: "Fruits" },
      { id: "c", text: "Carrot", group: "Vegetables" },
      { id: "a", text: "Apple", group: "Fruits" },
    ];

    const byText = (a: { text: string }, b: { text: string }) =>
      a.text.localeCompare(b.text);

    expect(groupItems(items, byText).map((item) => item.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  test("buckets ungrouped items together without reordering grouped ones", () => {
    const items = [{ id: 0 }, { id: 1, group: "Fruits" }, { id: 2 }];

    expect(groupItems(items).map((item) => item.id)).toEqual([0, 2, 1]);
  });

  test("returns an empty array for empty input", () => {
    expect(groupItems([])).toEqual([]);
  });

  test("does not mutate the input array", () => {
    const items = [
      { id: 0, group: "B" },
      { id: 1, group: "A" },
    ];
    const snapshot = [...items];

    groupItems(items);

    expect(items).toEqual(snapshot);
  });
});
