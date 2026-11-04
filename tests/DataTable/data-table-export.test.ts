import {
  serializeRows,
  toJson,
  withExtension,
} from "../../src/DataTable/data-table-utils.js";

describe("toJson", () => {
  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port", display: (port: unknown) => `:${port}` },
    { key: "secret", value: "Secret", columnHidden: true },
    { key: "actions", empty: true },
  ];
  const rows = [
    { id: "a", name: "Load Balancer 1", port: 3000, secret: "x" },
    { id: "b", name: undefined, port: 443, secret: "y" },
  ];

  it("applies display, skips empty and hidden columns, and nulls undefined", () => {
    expect(JSON.parse(toJson(headers, rows))).toEqual([
      { name: "Load Balancer 1", port: ":3000" },
      { name: null, port: ":443" },
    ]);
  });

  it("keys each object by label and indents with space", () => {
    expect(toJson(headers, [rows[0]], { keys: "label", space: 0 })).toBe(
      '[{"Name":"Load Balancer 1","Port":":3000"}]',
    );
  });
});

describe("serializeRows", () => {
  const headers = [{ key: "name", value: "Name" }];
  const rows = [{ id: "a", name: "Ada" }];

  it("serializes tsv with a tab delimiter", () => {
    expect(serializeRows(headers, [{ id: "a", name: "A\tB" }], "tsv")).toEqual({
      content: 'Name\r\n"A\tB"',
      mimeType: "text/tab-separated-values;charset=utf-8",
      extension: "tsv",
    });
  });

  it("starts csv, but not json, with a byte order mark", () => {
    expect(serializeRows(headers, rows, "csv", { bom: true }).content).toBe(
      "﻿Name\r\nAda",
    );
    expect(serializeRows(headers, rows, "json", { bom: true }).content).toBe(
      toJson(headers, rows),
    );
  });

  it("throws a TypeError for an unknown format", () => {
    expect(() =>
      serializeRows(headers, rows, "xml" as unknown as "csv"),
    ).toThrow(TypeError);
  });
});

describe("withExtension", () => {
  it("appends the extension unless the name already ends with it", () => {
    expect(withExtension("export", "csv")).toBe("export.csv");
    expect(withExtension("export.CSV", "csv")).toBe("export.CSV");
    expect(withExtension("report.v2", "json")).toBe("report.v2.json");
  });
});
