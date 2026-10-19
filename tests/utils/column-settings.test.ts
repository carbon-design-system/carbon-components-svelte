// @vitest-environment node
import {
  applyColumnSettings,
  setColumnHidden,
  toColumnSettings,
} from "../../src/utils/column-settings.js";

const display = (item: unknown) => item;
const sort = () => 0;

const headers = [
  { key: "name", value: "Name" },
  { key: "protocol", value: "Protocol", display },
  { key: "actions", empty: true as const },
  { key: "port", value: "Port", columnHidden: true, sort },
];

describe("toColumnSettings", () => {
  it("returns key order and hidden keys", () => {
    expect(toColumnSettings(headers)).toEqual({
      order: ["name", "protocol", "actions", "port"],
      hidden: ["port"],
    });
  });
});

describe("applyColumnSettings", () => {
  it("round trip equals the original headers by key/hidden", () => {
    const settings = toColumnSettings(headers);
    const result = applyColumnSettings(headers, settings);

    expect(result.map((header) => [header.key, !!header.columnHidden])).toEqual(
      headers.map((header) => [header.key, !!header.columnHidden]),
    );
    // Function-valued fields survive the round trip.
    expect(result.find((header) => header.key === "protocol")?.display).toBe(
      display,
    );
    expect(result.find((header) => header.key === "port")?.sort).toBe(sort);
  });

  it("ignores unknown keys in settings.order", () => {
    const result = applyColumnSettings(headers, {
      order: ["port", "name", "ghost"],
      hidden: [],
    });

    expect(result.map((header) => header.key)).toEqual([
      "port",
      "name",
      "protocol",
      "actions",
    ]);
  });

  it("appends headers missing from settings.order, keeping their relative order", () => {
    const result = applyColumnSettings(headers, {
      order: ["port"],
      hidden: [],
    });

    expect(result.map((header) => header.key)).toEqual([
      "port",
      "name",
      "protocol",
      "actions",
    ]);
  });

  it("sets an explicit false on headers not in settings.hidden", () => {
    const result = applyColumnSettings(headers, {
      order: ["name", "protocol", "actions", "port"],
      hidden: [],
    });

    expect(result.find((header) => header.key === "name")?.columnHidden).toBe(
      false,
    );
  });
});

describe("header types", () => {
  type Header = { key: "name" | "port"; value: string };
  const typed: Header[] = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
  ];

  it("applyColumnSettings returns the input header type", () => {
    const result = applyColumnSettings(typed, toColumnSettings(typed));
    expectTypeOf(result).toEqualTypeOf<Header[]>();
  });

  it("setColumnHidden returns the input header type", () => {
    expectTypeOf(setColumnHidden(typed, "port", true)).toEqualTypeOf<
      ReadonlyArray<Header>
    >();
  });
});

describe("setColumnHidden", () => {
  it("hides a visible column", () => {
    const result = setColumnHidden(headers, "name", true);
    expect(result.find((header) => header.key === "name")?.columnHidden).toBe(
      true,
    );
  });

  it("no-op returns the same reference when nothing changes", () => {
    expect(setColumnHidden(headers, "port", true)).toBe(headers);
    expect(setColumnHidden(headers, "name", false)).toBe(headers);
  });

  it("returns the same reference when the key is missing", () => {
    expect(setColumnHidden(headers, "ghost", true)).toBe(headers);
  });
});
