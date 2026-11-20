// @vitest-environment node
import {
  distinctValues,
  moveField,
  setAggregate,
  setFilterInclude,
  shiftEntry,
  zoneEntries,
} from "../../src/PivotTable/pivot-config.js";
import type { PivotConfig } from "../../src/PivotTable/pivot.js";

const fields = [
  { key: "region" },
  { key: "year", type: "number" as const },
  { key: "amount", type: "number" as const },
  { key: "note" },
];

const config: PivotConfig = {
  rows: [{ field: "region", sort: { by: "value" } }, "year"],
  columns: ["note"],
  values: [{ field: "amount", aggregate: "avg" }],
  filters: [],
};

describe("moveField", () => {
  it("never edits the config it is given", () => {
    const before = structuredClone(config);
    moveField(config, { field: "year", from: "rows", to: "columns" });
    expect(config).toEqual(before);
  });

  it("moves a row to the columns and keeps its options", () => {
    const next = moveField(config, {
      field: "region",
      from: "rows",
      to: "columns",
      toIndex: 0,
    });
    expect(next.rows).toEqual(["year"]);
    expect(next.columns).toEqual([
      { field: "region", sort: { by: "value" } },
      "note",
    ]);
  });

  it("puts an unplaced field at the end, or at an index", () => {
    expect(
      moveField(config, { field: "amount", from: "available", to: "rows" })
        .rows,
    ).toEqual([config.rows?.[0], "year", "amount"]);
    expect(
      moveField(config, {
        field: "amount",
        from: "available",
        to: "rows",
        toIndex: 1,
      }).rows,
    ).toEqual([config.rows?.[0], "amount", "year"]);
  });

  it("reorders within a zone by the gap it is dropped in", () => {
    const next = moveField(config, {
      field: "region",
      from: "rows",
      fromIndex: 0,
      to: "rows",
      toIndex: 2,
    });
    expect(next.rows).toEqual(["year", config.rows?.[0]]);
    const back = moveField(next, {
      field: "region",
      from: "rows",
      fromIndex: 1,
      to: "rows",
      toIndex: 0,
    });
    expect(back.rows).toEqual(config.rows);
  });

  it("keeps a dimension field in one of rows, columns and filters", () => {
    const next = moveField(config, {
      field: "note",
      from: "available",
      to: "filters",
    });
    expect(next.columns).toEqual([]);
    expect(next.filters).toEqual([{ field: "note" }]);
    const again = moveField(next, {
      field: "note",
      from: "filters",
      to: "rows",
    });
    expect(again.filters).toEqual([]);
    expect(again.rows).toContain("note");
  });

  it("adds a value with a default aggregate by field type, and lets it repeat", () => {
    const sum = moveField(
      config,
      { field: "year", from: "available", to: "values" },
      fields,
    );
    expect(sum.values?.at(-1)).toEqual({ field: "year", aggregate: "sum" });
    const count = moveField(
      config,
      { field: "note", from: "available", to: "values" },
      fields,
    );
    expect(count.values?.at(-1)).toEqual({ field: "note", aggregate: "count" });
    const twice = moveField(
      config,
      { field: "amount", from: "available", to: "values" },
      fields,
    );
    expect(twice.values?.map((v) => v.aggregate)).toEqual(["avg", "sum"]);
  });

  it("takes the value at fromIndex out of the values", () => {
    const two = moveField(
      config,
      { field: "amount", from: "available", to: "values" },
      fields,
    );
    const next = moveField(two, {
      field: "amount",
      from: "values",
      fromIndex: 1,
      to: "available",
    });
    expect(next.values).toEqual([{ field: "amount", aggregate: "avg" }]);
  });

  it("drops a field moved to available", () => {
    const next = moveField(config, {
      field: "year",
      from: "rows",
      to: "available",
    });
    expect(next.rows).toEqual([config.rows?.[0]]);
    expect(zoneEntries(next, fields, "available").map((e) => e.field)).toEqual([
      "year",
      "amount",
    ]);
  });
});

describe("the other edits", () => {
  it("shifts an entry and stops at the ends", () => {
    expect(shiftEntry(config, "rows", 1, -1).rows).toEqual([
      "year",
      config.rows?.[0],
    ]);
    expect(shiftEntry(config, "rows", 0, -1)).toBe(config);
    expect(shiftEntry(config, "rows", 1, 1)).toBe(config);
  });

  it("sets an aggregate", () => {
    expect(setAggregate(config, 0, "max").values).toEqual([
      { field: "amount", aggregate: "max" },
    ]);
    expect(setAggregate(config, 5, "max")).toBe(config);
  });

  it("sets a filter's included values", () => {
    const filtered = moveField(config, {
      field: "note",
      from: "columns",
      to: "filters",
    });
    expect(setFilterInclude(filtered, "note", ["a"]).filters).toEqual([
      { field: "note", include: ["a"] },
    ]);
  });

  it("lists distinct values in order, with blanks and a limit", () => {
    const records = [
      { n: "b" },
      { n: "a" },
      { n: "b" },
      { n: "" },
      { n: "c" },
      {},
    ];
    expect(distinctValues(records, "n")).toEqual({
      values: ["a", "b", "c"],
      blank: true,
      truncated: false,
    });
    expect(distinctValues(records, "n", 2)).toMatchObject({ truncated: true });
    expect(distinctValues([{ n: 10 }, { n: 9 }], "n").values).toEqual([9, 10]);
  });
});
