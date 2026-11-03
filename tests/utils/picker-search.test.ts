// @vitest-environment node
import {
  createPickerIndex,
  searchPickerIndex,
} from "../../src/utils/picker-search.js";

const items = [
  { id: "AddAlt", label: "Add alt", keywords: ["plus", "new"] },
  { id: "Add", label: "Add", keywords: ["plus"] },
  { id: "Cafe", label: "Café" },
  { id: "AddComment", label: "Add comment" },
  { id: "Calendar", label: "Calendar", keywords: ["date", "add event"] },
];
const index = createPickerIndex(items);
const ids = (query: string) =>
  searchPickerIndex(index, query).map((item) => item.id);

describe("searchPickerIndex", () => {
  it("returns every item in order for an empty query", () => {
    expect(ids("  ")).toEqual(items.map((item) => item.id));
  });

  it("ranks an exact label, then a label prefix, then a word, then the keywords", () => {
    expect(ids("add")).toEqual(["Add", "AddAlt", "AddComment", "Calendar"]);
    expect(ids("comment")).toEqual(["AddComment"]);
    expect(ids("plus")).toEqual(["AddAlt", "Add"]);
  });

  it("needs every word to match, in any order", () => {
    expect(ids("comment add")).toEqual(["AddComment"]);
    expect(ids("add zzz")).toEqual([]);
  });

  it("ignores case and accents", () => {
    expect(ids("CAFE")).toEqual(["Cafe"]);
    expect(ids("café")).toEqual(["Cafe"]);
  });
});
