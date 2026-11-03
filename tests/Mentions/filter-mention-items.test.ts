// @vitest-environment node
import { filterMentionItems } from "../../src/Mentions/filter-mention-items.js";

const items = [
  { id: 1, text: "Bob Alder" },
  { id: 2, text: "Alice Johnson", secondary: "@alice" },
  { id: 3, text: "Dana Malik" },
  { id: 4, text: "José Alvarez" },
  { id: 5, text: "Carol", secondary: "@al" },
  { id: 6, text: "Alan Turing" },
];

const ids = (list: { id: unknown }[]) => list.map((item) => item.id);

describe("filterMentionItems", () => {
  it("returns the first items for an empty query", () => {
    expect(ids(filterMentionItems(items, "", 2))).toEqual([1, 2]);
    expect(ids(filterMentionItems(items, "   ", 2))).toEqual([1, 2]);
  });

  it("ranks a prefix, then a later word, then a substring, then secondary text", () => {
    expect(ids(filterMentionItems(items, "al"))).toEqual([2, 6, 1, 4, 3, 5]);
  });

  it("keeps the list's order within a rank", () => {
    expect(ids(filterMentionItems(items, "a", 3))).toEqual([2, 6, 1]);
  });

  it("ignores case and accents", () => {
    expect(ids(filterMentionItems(items, "JOSE"))).toEqual([4]);
    expect(ids(filterMentionItems(items, "josé alv"))).toEqual([4]);
  });

  it("stops at the limit", () => {
    expect(filterMentionItems(items, "a", 2)).toHaveLength(2);
  });

  it("does not change the list", () => {
    const before = [...items];
    filterMentionItems(items, "al");
    expect(items).toEqual(before);
  });

  it("ranks 10,000 users well inside a frame", () => {
    const users = Array.from({ length: 10_000 }, (_, i) => ({
      id: i,
      text: `User ${i} Name`,
      secondary: `@user${i}`,
    }));
    filterMentionItems(users, "x"); // builds the folded copy once
    const start = performance.now();
    for (let n = 0; n < 50; n++) filterMentionItems(users, "name 99");
    expect((performance.now() - start) / 50).toBeLessThan(4);
  });
});
