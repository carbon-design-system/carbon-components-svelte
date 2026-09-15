import {
  applyColumnSettings,
  moveColumn,
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
  test("returns key order and hidden keys", () => {
    expect(toColumnSettings(headers)).toEqual({
      order: ["name", "protocol", "actions", "port"],
      hidden: ["port"],
    });
  });
});

describe("applyColumnSettings", () => {
  test("round trip equals the original headers by key/hidden", () => {
    const settings = toColumnSettings(headers);
    const result = applyColumnSettings(headers, settings);

    expect(result.map((header) => [header.key, !!header.columnHidden])).toEqual(
      headers.map((header) => [header.key, !!header.columnHidden]),
    );
  });

  test("ignores unknown keys in settings.order", () => {
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

  test("appends headers missing from settings.order, keeping their relative order", () => {
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

  test("keeps functions on headers", () => {
    const settings = toColumnSettings(headers);
    const result = applyColumnSettings(headers, settings);

    expect(result.find((header) => header.key === "protocol")?.display).toBe(
      display,
    );
    expect(result.find((header) => header.key === "port")?.sort).toBe(sort);
  });

  test("sets an explicit false on headers not in settings.hidden", () => {
    const result = applyColumnSettings(headers, {
      order: ["name", "protocol", "actions", "port"],
      hidden: [],
    });

    expect(result.find((header) => header.key === "name")?.columnHidden).toBe(
      false,
    );
  });
});

describe("moveColumn", () => {
  test("moving the first column up is a no-op (same reference)", () => {
    expect(moveColumn(headers, "name", -1)).toBe(headers);
  });

  test("moving down skips an empty header", () => {
    const result = moveColumn(headers, "protocol", 1);
    expect(result.map((header) => header.key)).toEqual([
      "name",
      "port",
      "actions",
      "protocol",
    ]);
  });

  test("moving up skips an empty header", () => {
    const result = moveColumn(headers, "port", -1);
    expect(result.map((header) => header.key)).toEqual([
      "name",
      "port",
      "actions",
      "protocol",
    ]);
  });

  test("moving the last column down is a no-op (same reference)", () => {
    expect(moveColumn(headers, "port", 1)).toBe(headers);
  });

  test("returns the same reference when the key is missing", () => {
    expect(moveColumn(headers, "ghost", 1)).toBe(headers);
  });
});

describe("setColumnHidden", () => {
  test("hides a visible column", () => {
    const result = setColumnHidden(headers, "name", true);
    expect(result.find((header) => header.key === "name")?.columnHidden).toBe(
      true,
    );
  });

  test("no-op returns the same reference when nothing changes", () => {
    expect(setColumnHidden(headers, "port", true)).toBe(headers);
    expect(setColumnHidden(headers, "name", false)).toBe(headers);
  });

  test("returns the same reference when the key is missing", () => {
    expect(setColumnHidden(headers, "ghost", true)).toBe(headers);
  });
});
