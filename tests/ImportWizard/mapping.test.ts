// @vitest-environment node
import {
  autoMap,
  normalizeHeader,
  similarity,
} from "../../src/ImportWizard/automap.js";
import {
  convertCell,
  defaultMessages,
  parseDate,
  parseNumber,
  unmatchedValues,
} from "../../src/ImportWizard/schema.js";
import { toTable } from "../../src/ImportWizard/table.js";

describe("normalizeHeader", () => {
  it.each([
    ["E-mail Address", "e mail address"],
    ["emailAddress", "email address"],
    ["  First_Name ", "first name"],
    ["Prénom", "prenom"],
    ["ZIP/Postal Code", "zip postal code"],
  ])("%s", (input, expected) => {
    expect(normalizeHeader(input)).toBe(expected);
  });
});

describe("similarity", () => {
  it("is 1 for the same words in any spacing or case", () => {
    expect(similarity("First Name", "first_name")).toBe(1);
    expect(similarity("firstName", "FIRSTNAME")).toBe(1);
  });

  it("scores reordered words high and unrelated ones low", () => {
    expect(similarity("Name First", "First Name")).toBe(0.95);
    expect(similarity("Phone", "Department")).toBeLessThan(0.3);
  });

  it("scores a contained name above a typo's pair score", () => {
    expect(similarity("Email Address", "Email")).toBeGreaterThanOrEqual(0.6);
    expect(similarity("Emial", "Email")).toBeGreaterThan(0.5);
  });

  it("is 0 for empty input", () => {
    expect(similarity("", "Email")).toBe(0);
    expect(similarity("---", "Email")).toBe(0);
  });
});

describe("autoMap", () => {
  const fields = [
    { key: "name", label: "Full name", aliases: ["customer", "contact"] },
    { key: "email", label: "Email", aliases: ["e-mail", "mail"] },
    { key: "role", label: "Role" },
    { key: "phone", label: "Phone number", aliases: ["tel", "mobile"] },
  ];

  it("matches labels, keys and aliases and says which", () => {
    const result = autoMap(["Contact", "E-Mail", "ROLE", "Notes"], fields);
    expect(result.mapping).toEqual(["name", "email", "role", null]);
    expect(result.reasons).toEqual(["alias", "exact", "exact", null]);
    expect(result.scores[3]).toBe(0);
  });

  it("matches by similarity", () => {
    const result = autoMap(["Full Name (legal)", "Phone no.", "Emial"], fields);
    expect(result.mapping).toEqual(["name", "phone", "email"]);
    expect(result.reasons).toEqual(["similar", "similar", "similar"]);
  });

  it("gives each field to one column, the best one", () => {
    const result = autoMap(["Email", "Email address", "Mail"], fields);
    expect(result.mapping.filter((k) => k === "email")).toHaveLength(1);
    expect(result.mapping[0]).toBe("email");
  });

  it("leaves a column unmapped below the threshold", () => {
    expect(autoMap(["Department"], fields).mapping).toEqual([null]);
    expect(autoMap(["Phone no."], fields, { threshold: 0.99 }).mapping).toEqual(
      [null],
    );
  });

  it("maps nothing for no headers", () => {
    expect(autoMap([], fields).mapping).toEqual([]);
  });
});

describe("parseNumber", () => {
  it.each([
    ["42", ".", 42],
    ["-3.5", ".", -3.5],
    ["+7", ".", 7],
    ["1,234.56", ".", 1234.56],
    ["1 234,5", ",", 1234.5],
    ["1.234,56", ",", 1234.56],
    [".5", ".", 0.5],
    ["1e3", ".", 1000],
    ["1,23", ".", undefined],
    ["12abc", ".", undefined],
    ["", ".", undefined],
    ["-", ".", undefined],
  ])("%s with decimal %s", (text, decimal, expected) => {
    expect(parseNumber(text, decimal as "." | ",")).toBe(expected);
  });
});

describe("parseDate", () => {
  it("parses each format into ISO", () => {
    expect(parseDate("2024-03-09")).toBe("2024-03-09");
    expect(parseDate("2024-03-09T10:00:00")).toBe("2024-03-09");
    expect(parseDate("3/9/2024", ["MM/DD/YYYY"])).toBe("2024-03-09");
    expect(parseDate("9/3/2024", ["DD/MM/YYYY"])).toBe("2024-03-09");
    expect(parseDate("09.03.2024", ["DD.MM.YYYY"])).toBe("2024-03-09");
    expect(parseDate("45292", ["serial"])).toBe("2024-01-01");
  });

  it("rejects dates that don't exist", () => {
    expect(parseDate("2024-02-30")).toBeUndefined();
    expect(parseDate("13/01/2024", ["MM/DD/YYYY"])).toBeUndefined();
    expect(parseDate("2023-02-29")).toBeUndefined();
    expect(parseDate("2024-02-29")).toBe("2024-02-29");
  });

  it("tries the formats in order", () => {
    expect(parseDate("13/01/2024", ["MM/DD/YYYY", "DD/MM/YYYY"])).toBe(
      "2024-01-13",
    );
  });
});

describe("convertCell", () => {
  const text = { key: "n", label: "Name" };

  it("trims, and keeps spaces when trim is off", () => {
    expect(convertCell(text, "  Ada ")).toEqual({ value: "Ada" });
    expect(convertCell(text, "  Ada ", { trim: false })).toEqual({
      value: "  Ada ",
    });
  });

  it("turns an empty cell into null, or an error when required", () => {
    expect(convertCell(text, "  ")).toEqual({ value: null });
    expect(convertCell({ ...text, required: true }, "")).toEqual({
      error: "Name is required",
    });
  });

  it("converts numbers and checks bounds", () => {
    const age = {
      key: "a",
      label: "Age",
      type: "integer" as const,
      min: 18,
      max: 65,
    };
    expect(convertCell(age, "30")).toEqual({ value: 30 });
    expect(convertCell(age, "30.5")).toEqual({ error: "Enter a whole number" });
    expect(convertCell(age, "abc")).toEqual({ error: "Enter a number" });
    expect(convertCell(age, "10")).toEqual({ error: "Use 18 or more" });
    expect(convertCell(age, "70")).toEqual({ error: "Use 65 or less" });
  });

  it("converts booleans and honors a value map", () => {
    const flag = { key: "b", label: "Active", type: "boolean" as const };
    expect(convertCell(flag, "Y")).toEqual({ value: true });
    expect(convertCell(flag, "no")).toEqual({ value: false });
    expect(convertCell(flag, "maybe")).toEqual({ error: "Enter yes or no" });
    expect(
      convertCell(flag, "Current", { valueMap: { current: "yes" } }),
    ).toEqual({
      value: true,
    });
  });

  it("converts dates by field formats or the transform's format", () => {
    const date = {
      key: "d",
      label: "Start",
      type: "date" as const,
      dateFormats: ["MM/DD/YYYY"],
    };
    expect(convertCell(date, "3/9/2024")).toEqual({ value: "2024-03-09" });
    expect(convertCell(date, "2024-03-09")).toEqual({
      error: "Enter a date as MM/DD/YYYY",
    });
    expect(convertCell(date, "9/3/2024", { dateFormat: "DD/MM/YYYY" })).toEqual(
      {
        value: "2024-03-09",
      },
    );
  });

  it("lowercases and checks emails", () => {
    const email = { key: "e", label: "Email", type: "email" as const };
    expect(convertCell(email, " Ada@Example.COM ")).toEqual({
      value: "ada@example.com",
    });
    expect(convertCell(email, "ada@")).toEqual({
      error: "Enter a valid email address",
    });
  });

  it("matches enum options by value, label and alias, and maps values", () => {
    const role = {
      key: "r",
      label: "Role",
      type: "enum" as const,
      options: [
        { value: "admin", label: "Administrator", aliases: ["root"] },
        "member",
      ],
    };
    expect(convertCell(role, "ADMIN")).toEqual({ value: "admin" });
    expect(convertCell(role, "Administrator")).toEqual({ value: "admin" });
    expect(convertCell(role, "root")).toEqual({ value: "admin" });
    expect(convertCell(role, "Member")).toEqual({ value: "member" });
    expect(convertCell(role, "guest")).toEqual({
      error: "Use one of: Administrator, member",
    });
    expect(
      convertCell(role, "guest", { valueMap: { guest: "member" } }),
    ).toEqual({
      value: "member",
    });
  });

  it("checks length and pattern", () => {
    const code = {
      key: "c",
      label: "Code",
      minLength: 2,
      maxLength: 4,
      pattern: /^[A-Z]+$/g,
      patternMessage: "Use capitals",
    };
    expect(convertCell(code, "AB")).toEqual({ value: "AB" });
    // A global regex must not carry lastIndex between cells.
    expect(convertCell(code, "AB")).toEqual({ value: "AB" });
    expect(convertCell(code, "A")).toEqual({
      error: "Use at least 2 characters",
    });
    expect(convertCell(code, "ABCDE")).toEqual({
      error: "Use at most 4 characters",
    });
    expect(convertCell(code, "ab")).toEqual({ error: "Use capitals" });
  });

  it("takes custom messages", () => {
    const field = { key: "x", label: "X", required: true };
    const result = convertCell(field, "", undefined, {
      ...defaultMessages,
      required: () => "Fill me in",
    });
    expect(result).toEqual({ error: "Fill me in" });
  });
});

describe("unmatchedValues", () => {
  it("lists values that match no option, most frequent first", () => {
    const field = {
      key: "r",
      label: "Role",
      type: "enum" as const,
      options: ["admin", "member"],
    };
    expect(
      unmatchedValues(field, [
        "admin",
        "boss",
        "Boss",
        "boss",
        "",
        "owner",
        "member",
      ]),
    ).toEqual([
      { value: "boss", count: 2 },
      { value: "Boss", count: 1 },
      { value: "owner", count: 1 },
    ]);
  });

  it("knows boolean words", () => {
    const field = { key: "b", label: "B", type: "boolean" as const };
    expect(unmatchedValues(field, ["Y", "N", "true", "Current"])).toEqual([
      { value: "Current", count: 1 },
    ]);
  });
});

describe("toTable", () => {
  it("splits the header from the rows", () => {
    const table = toTable([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(table.headers).toEqual(["a", "b"]);
    expect(table.rows).toEqual([["1", "2"]]);
  });

  it("names blank and repeated headers", () => {
    expect(toTable([["a", "", "A", "a"], []]).headers).toEqual([
      "a",
      "Column 2",
      "A (2)",
      "a (3)",
    ]);
  });

  it("pads short rows and reports long ones", () => {
    const table = toTable([
      ["a", "b", "c"],
      ["1"],
      ["1", "2", "3", "4", "5"],
      ["x", "y", "z"],
    ]);
    expect(table.rows).toEqual([
      ["1", "", ""],
      ["1", "2", "3"],
      ["x", "y", "z"],
    ]);
    expect(table.short).toBe(1);
    expect([...table.long]).toEqual([[1, 5]]);
  });

  it("treats every record as data without a header", () => {
    const table = toTable(
      [
        ["1", "2"],
        ["3", "4", "5"],
      ],
      { hasHeader: false },
    );
    expect(table.headers).toEqual(["Column 1", "Column 2", "Column 3"]);
    expect(table.rows).toHaveLength(2);
  });

  it("handles no records", () => {
    expect(toTable([])).toMatchObject({ headers: [], rows: [] });
  });
});
