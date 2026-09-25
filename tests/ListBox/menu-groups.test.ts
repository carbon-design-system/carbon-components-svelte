// @vitest-environment node
import {
  createGroupRows,
  hoistWithinGroups,
  orderByGroup,
  splitGroupRuns,
} from "../../src/ListBox/menu-groups.js";

type Entry = { id: string; group?: string; checked?: boolean };

const ids = (entries: ReadonlyArray<{ id: string }>) =>
  entries.map((entry) => entry.id);

describe("orderByGroup", () => {
  it("puts ungrouped entries first, then groups in first-appearance order", () => {
    const entries: Entry[] = [
      { id: "a", group: "West" },
      { id: "b" },
      { id: "c", group: "East" },
      { id: "d", group: "West" },
      { id: "e", group: "" },
    ];

    expect(ids(orderByGroup(entries, (entry) => entry.group))).toEqual([
      "b",
      "e",
      "a",
      "d",
      "c",
    ]);
  });

  it("sorts within each group, never across groups", () => {
    const entries: Entry[] = [
      { id: "d", group: "West" },
      { id: "c", group: "East" },
      { id: "b", group: "West" },
      { id: "z" },
      { id: "a", group: "East" },
      { id: "y" },
    ];
    const byId = (a: Entry, b: Entry) => a.id.localeCompare(b.id);

    expect(ids(orderByGroup(entries, (entry) => entry.group, byId))).toEqual([
      "y",
      "z",
      "b",
      "d",
      "a",
      "c",
    ]);
  });

  it("keeps order without a comparator and does not mutate the input", () => {
    const entries: Entry[] = [{ id: "b" }, { id: "a", group: "" }];

    expect(ids(orderByGroup(entries, (entry) => entry.group))).toEqual([
      "b",
      "a",
    ]);
    expect(ids(entries)).toEqual(["b", "a"]);
    expect(orderByGroup([], () => undefined)).toEqual([]);
  });
});

describe("hoistWithinGroups", () => {
  it("moves matching items to the top of their own group only", () => {
    const items: Entry[] = [
      { id: "a", group: "West" },
      { id: "b", group: "West", checked: true },
      { id: "c", group: "East" },
      { id: "d", group: "East", checked: true },
    ];

    expect(ids(hoistWithinGroups(items, (item) => !!item.checked))).toEqual([
      "b",
      "a",
      "d",
      "c",
    ]);
  });

  it("treats ungrouped input as one run", () => {
    const items: Entry[] = [
      { id: "a" },
      { id: "b", checked: true },
      { id: "c", checked: true },
    ];

    expect(ids(hoistWithinGroups(items, (item) => !!item.checked))).toEqual([
      "b",
      "c",
      "a",
    ]);
    expect(hoistWithinGroups([], () => true)).toEqual([]);
  });
});

describe("createGroupRows", () => {
  const items: Entry[] = [
    { id: "all" },
    { id: "a", group: "West" },
    { id: "b", group: "West" },
    { id: "c", group: "East" },
  ];

  it("inserts a header row before each group and maps indexes both ways", () => {
    const { rows, itemIndexByRow, rowIndexByItem, groupIndexByRow, headers } =
      createGroupRows<Entry>()(items);

    expect(rows.map((row) => ("items" in row ? row.group : row.id))).toEqual([
      "all",
      "West",
      "a",
      "b",
      "East",
      "c",
    ]);
    expect(itemIndexByRow).toEqual([0, -1, 1, 2, -1, 3]);
    expect(rowIndexByItem).toEqual([0, 2, 3, 5]);
    expect(groupIndexByRow).toEqual([-1, 0, 0, 0, 1, 1]);
    expect(headers.map((header) => ids(header.items))).toEqual([
      ["a", "b"],
      ["c"],
    ]);
  });

  it("keeps header keys stable across rebuilds", () => {
    const build = createGroupRows<Entry>();
    const first = build(items);
    const second = build(items.slice(1));

    expect(second.headers[0].id).toBe(first.headers[0].id);
    expect(second.headers[1].id).toBe(first.headers[1].id);
  });

  it("gives a label split into two runs distinct keys", () => {
    const { headers } = createGroupRows<Entry>()([
      { id: "a", group: "West" },
      { id: "b" },
      { id: "c", group: "West" },
    ]);

    expect(headers).toHaveLength(2);
    expect(headers[0].id).not.toBe(headers[1].id);
  });

  it("returns no rows for no items", () => {
    expect(createGroupRows<Entry>()([])).toEqual({
      rows: [],
      itemIndexByRow: [],
      rowIndexByItem: [],
      groupIndexByRow: [],
      headers: [],
    });
  });
});

describe("splitGroupRuns", () => {
  const groupRows = createGroupRows<Entry>()([
    { id: "all" },
    { id: "a", group: "West" },
    { id: "b", group: "West" },
    { id: "c", group: "East" },
  ]);

  it("splits rows into one run per group, keyed by the group's header", () => {
    const runs = splitGroupRuns(groupRows.rows, 0, groupRows);

    expect(
      runs.map((run) => [run.start, run.rows.length, run.groupIndex]),
    ).toEqual([
      [0, 1, -1],
      [1, 3, 0],
      [4, 2, 1],
    ]);
    expect(runs[1].key).toBe(groupRows.headers[0].id);
  });

  it("keeps the group of a window that starts partway through it", () => {
    const runs = splitGroupRuns(groupRows.rows.slice(3, 6), 3, groupRows);

    expect(
      runs.map((run) => [run.start, run.rows.length, run.groupIndex]),
    ).toEqual([
      [3, 1, 0],
      [4, 2, 1],
    ]);
  });

  it("returns the window as one ungrouped run without group rows", () => {
    const rows = [{ id: "a" }, { id: "b" }];
    const [run, ...rest] = splitGroupRuns(rows, 5, null);

    expect(rest).toEqual([]);
    expect(run.rows).toBe(rows);
    expect(run).toMatchObject({ start: 5, groupIndex: -1 });
    expect(splitGroupRuns([], 0, groupRows)).toEqual([]);
  });
});
