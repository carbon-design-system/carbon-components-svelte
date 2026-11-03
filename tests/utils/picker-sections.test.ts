// @vitest-environment node
import { buildPickerSections } from "../../src/utils/picker-sections.js";

const items = [
  { id: "a", label: "A", category: "x" },
  { id: "b", label: "B", category: "y" },
  { id: "c", label: "C", category: "x" },
  { id: "d", label: "D" },
];

describe("buildPickerSections", () => {
  it("groups by category in order of first appearance, uncategorized last", () => {
    const sections = buildPickerSections({ items });
    expect(sections.ids).toEqual(["x", "y", "uncategorized"]);
    expect(sections.counts).toEqual([2, 1, 1]);
    expect(sections.list.map((item) => item.id)).toEqual(["a", "c", "b", "d"]);
    expect(sections.labels).toEqual(["x", "y", "All"]);
  });

  it("orders and labels categories from `categories`", () => {
    const sections = buildPickerSections({
      items,
      categories: [{ id: "y", label: "Why" }, { id: "x" }],
    });
    expect(sections.labels.slice(0, 2)).toEqual(["Why", "x"]);
  });

  it("puts the recent items first, and keeps them in their category too", () => {
    const sections = buildPickerSections({ items, recent: [items[1]] });
    expect(sections.ids[0]).toBe("recent");
    expect(sections.list.filter((item) => item.id === "b")).toHaveLength(2);
  });

  it("needs no header for one section with no label", () => {
    const lone = [{ id: "a", label: "A" }];
    const sections = buildPickerSections({ items: lone });
    expect(sections.headers).toEqual([false]);
    const withRecent = buildPickerSections({ items: lone, recent: lone });
    expect(withRecent.headers).toEqual([true, true]);
  });

  it("lays search results out in one section with no header", () => {
    const sections = buildPickerSections({ items, grouped: false });
    expect(sections.ids).toEqual(["results"]);
    expect(sections.headers).toEqual([false]);
  });
});
