// @vitest-environment node
import {
  activeFilters,
  type AddSelectItem,
  createItemsFetcher,
  formatItemPath,
} from "../../src/utils/add-select.js";

const items: AddSelectItem[] = [
  { id: "fin", title: "Finance", hasChildren: true },
  { id: "hr", title: "People", hasChildren: true },
  { id: "rev", title: "Revenue", parentId: "fin", hasChildren: true },
  {
    id: "q1",
    title: "Q1 revenue",
    parentId: "rev",
    description: "Booked revenue by quarter",
    attributes: { type: "table", owner: ["finance", "ops"] },
  },
  {
    id: "q2",
    title: "Q2 revenue",
    parentId: "rev",
    attributes: { type: "view", owner: "finance" },
  },
  {
    id: "head",
    title: "Headcount",
    parentId: "hr",
    attributes: { type: "table", owner: "people" },
  },
];

const request = {
  query: "",
  parentId: null,
  filters: {},
  scope: "level" as const,
};

describe("createItemsFetcher", () => {
  const fetch = createItemsFetcher(items, { pageSize: 2 });

  it("answers one level at a time", () => {
    expect(fetch(request).items.map((i) => i.id)).toEqual(["fin", "hr"]);
    expect(
      fetch({ ...request, parentId: "fin" }).items.map((i) => i.id),
    ).toEqual(["rev"]);
  });

  it("pages with an offset cursor and reports the total", () => {
    const first = fetch({ ...request, parentId: "rev" });
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).toBeNull();

    const paged = createItemsFetcher(items, { pageSize: 1 });
    const one = paged({ ...request, parentId: "rev" });
    expect(one).toMatchObject({ nextCursor: 1, total: 2 });
    const two = paged({ ...request, parentId: "rev" }, { cursor: 1 });
    expect(two.items.map((i) => i.id)).toEqual(["q2"]);
    expect(two.nextCursor).toBeNull();
  });

  it("searches within a level by default", () => {
    const page = fetch({ ...request, query: "revenue" });
    expect(page.items).toEqual([]);
  });

  it("searches every level for scope all, with the path of each result", () => {
    const page = fetch({ ...request, query: "revenue", scope: "all" });
    expect(page.total).toBe(3);
    const q1 = page.items.find((i) => i.id === "q1");
    expect(formatItemPath(q1?.path)).toBe("Finance / Revenue");
  });

  it("matches every word, in the title or the description", () => {
    const page = fetch({ ...request, query: "booked q1", scope: "all" });
    expect(page.items.map((i) => i.id)).toEqual(["q1"]);
  });

  it("filters leaves by attribute and keeps folders in a level", () => {
    const filters = { type: ["table"] };
    const level = fetch({ ...request, parentId: "rev", filters });
    expect(level.items.map((i) => i.id)).toEqual(["q1"]);

    const top = fetch({ ...request, filters });
    expect(top.items.map((i) => i.id)).toEqual(["fin", "hr"]);

    const all = fetch({ ...request, scope: "all", filters });
    expect(all.items.map((i) => i.id)).toEqual(["q1", "head"]);
  });

  it("ORs the values of one group and ANDs the groups", () => {
    const any = fetch({
      ...request,
      scope: "all",
      filters: { type: ["table", "view"] },
    });
    expect(any.total).toBe(3);
    const both = fetch({
      ...request,
      scope: "all",
      filters: { type: ["table", "view"], owner: ["ops"] },
    });
    expect(both.items.map((i) => i.id)).toEqual(["q1"]);
  });
});

describe("activeFilters", () => {
  it("drops empty groups and orders the rest so equal requests share a key", () => {
    expect(
      JSON.stringify(activeFilters({ owner: [], type: ["view", "table"] })),
    ).toBe('{"type":["table","view"]}');
  });
});
