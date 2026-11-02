import type {
  QueryField,
  QueryGroup,
} from "../../src/QueryBuilder/QueryBuilder.svelte";
import {
  carryValue,
  conditionToText,
  countConditions,
  evaluateQuery,
  operatorsFor,
  queryFromJSON,
  queryToJSON,
  queryToText,
  validateCondition,
  validateQuery,
  valueArity,
} from "../../src/QueryBuilder/query.js";

const fields: QueryField[] = [
  { id: "name", text: "Name", kind: "text" },
  { id: "seats", text: "Seats", kind: "number", min: 0, max: 100 },
  { id: "renewal", text: "Renewal", kind: "date" },
  {
    id: "plan",
    text: "Plan",
    kind: "option",
    options: [
      { id: "free", text: "Free" },
      { id: "team", text: "Team" },
    ],
  },
  { id: "active", text: "Active", kind: "boolean" },
  {
    id: "owner",
    text: "Owner",
    kind: "text",
    operators: ["is", "isEmpty"],
    getValue: (row: { owner?: { name: string } }) => row.owner?.name,
  },
];

describe("operators", () => {
  it("lists the operators of a kind, or the field's own subset in its order", () => {
    expect(operatorsFor(fields[4])).toEqual(["is"]);
    expect(operatorsFor(fields[5])).toEqual(["is", "isEmpty"]);
    expect(
      operatorsFor({
        id: "x",
        text: "X",
        kind: "text",
        operators: ["gt" as never, "is"],
      }),
    ).toEqual(["is"]);
  });

  it.each([
    ["isEmpty", "none"],
    ["between", "two"],
    ["isAnyOf", "many"],
    ["contains", "one"],
  ])("%s takes %s value(s)", (operator, arity) => {
    expect(valueArity(operator)).toBe(arity);
  });

  it("carries a value only where its shape still fits", () => {
    const seats = fields[1];
    expect(carryValue(seats, "gt", "lte", 4)).toBe(4);
    expect(carryValue(seats, "gt", "between", 4)).toEqual([null, null]);
    expect(carryValue(seats, "between", "gt", [3, 9])).toBe(3);
    expect(carryValue(seats, "gt", "isEmpty", 4)).toBeNull();
    expect(carryValue(fields[3], "is", "isAnyOf", "team")).toEqual(["team"]);
    expect(carryValue(fields[3], "isAnyOf", "is", ["free", "team"])).toBe(
      "free",
    );
    expect(carryValue(fields[3], "is", "isAnyOf", null)).toEqual([]);
  });
});

describe("validateCondition", () => {
  const check = (field: string, operator: string, value: unknown) =>
    validateCondition(
      { field, operator, value },
      fields.find((candidate) => candidate.id === field),
    );

  it("accepts complete conditions", () => {
    expect(check("name", "contains", "a")).toBeNull();
    expect(check("seats", "between", [1, 5])).toBeNull();
    expect(check("renewal", "before", "2026-05-01")).toBeNull();
    expect(check("plan", "isAnyOf", ["free"])).toBeNull();
    expect(check("active", "is", false)).toBeNull();
    expect(check("name", "isEmpty", null)).toBeNull();
  });

  it.each([
    ["name", "contains", "  ", "required"],
    ["name", "startsWith", 4, "required"],
    ["seats", "gt", null, "required"],
    ["seats", "gt", 101, "bounds"],
    ["seats", "between", [1, null], "required"],
    ["seats", "between", [9, 2], "range"],
    ["renewal", "is", "05/01/2026", "required"],
    ["renewal", "between", ["2026-06-01", "2026-05-01"], "range"],
    ["plan", "is", "gold", "required"],
    ["plan", "isAnyOf", [], "required"],
    ["active", "is", "yes", "required"],
    ["name", "gt", 1, "operator"],
    ["gone", "is", "x", "field"],
  ])("%s %s %j is %s", (field, operator, value, code) => {
    expect(check(field, operator, value)).toBe(code);
  });
});

describe("validateQuery", () => {
  it("keys errors by node id, or by index path without ids", () => {
    const query: QueryGroup = {
      operator: "and",
      conditions: [
        { field: "name", operator: "contains", value: "ok" },
        {
          operator: "or",
          conditions: [
            { field: "seats", operator: "gt", value: null },
            { id: "named", field: "name", operator: "is", value: "" },
          ],
        },
      ],
    };

    expect(validateQuery(query, fields)).toEqual({
      valid: false,
      errors: { "1.0": "required", named: "required" },
    });
    expect(
      validateQuery({ operator: "and", conditions: [] }, fields).valid,
    ).toBe(true);
  });
});

describe("evaluateQuery", () => {
  const row = {
    name: "Acme Corp",
    seats: 40,
    renewal: "2026-05-01",
    plan: "team",
    active: true,
    owner: { name: "Ada" },
  };
  const run = (query: QueryGroup, target: object = row) =>
    evaluateQuery(query, target, fields);

  it("tests each kind", () => {
    const one = (field: string, operator: string, value: unknown) =>
      run({ operator: "and", conditions: [{ field, operator, value }] });

    expect(one("name", "contains", "ACME")).toBe(true);
    expect(one("name", "endsWith", "acme")).toBe(false);
    expect(one("seats", "gte", 40)).toBe(true);
    expect(one("seats", "between", [41, 50])).toBe(false);
    expect(one("renewal", "before", "2026-05-02")).toBe(true);
    expect(one("renewal", "onOrAfter", "2026-05-02")).toBe(false);
    expect(one("plan", "isNoneOf", ["free"])).toBe(true);
    expect(one("plan", "isAnyOf", ["free"])).toBe(false);
    expect(one("active", "is", false)).toBe(false);
    expect(one("owner", "is", "ada")).toBe(true);
    expect(one("name", "isEmpty", null)).toBe(false);
    expect(one("seats", "isEmpty", null)).toBe(false);
  });

  it("compares a Date by its day", () => {
    expect(
      run(
        {
          operator: "and",
          conditions: [
            { field: "renewal", operator: "is", value: "2026-05-01" },
          ],
        },
        { ...row, renewal: new Date("2026-05-01T10:00:00Z") },
      ),
    ).toBe(true);
  });

  it("combines groups with and, or and nesting", () => {
    const query: QueryGroup = {
      operator: "and",
      conditions: [
        { field: "active", operator: "is", value: true },
        {
          operator: "or",
          conditions: [
            { field: "seats", operator: "gt", value: 90 },
            { field: "plan", operator: "is", value: "team" },
          ],
        },
      ],
    };
    expect(run(query)).toBe(true);
    expect(run(query, { ...row, plan: "free" })).toBe(false);
  });

  it("skips incomplete conditions and empty groups", () => {
    expect(
      run({
        operator: "or",
        conditions: [
          { field: "name", operator: "contains", value: "" },
          { operator: "and", conditions: [] },
        ],
      }),
    ).toBe(true);
    expect(
      run({
        operator: "or",
        conditions: [
          { field: "name", operator: "contains", value: "" },
          { field: "seats", operator: "gt", value: 99 },
        ],
      }),
    ).toBe(false);
  });
});

describe("text", () => {
  const query: QueryGroup = {
    operator: "and",
    conditions: [
      { field: "name", operator: "contains", value: "Acme" },
      {
        operator: "or",
        conditions: [
          { field: "seats", operator: "between", value: [5, 9] },
          { field: "plan", operator: "isAnyOf", value: ["free", "team"] },
        ],
      },
      {
        operator: "or",
        conditions: [{ field: "active", operator: "is", value: true }],
      },
      { field: "name", operator: "is", value: "" },
    ],
  };

  it("reads a query as one sentence and leaves out what is incomplete", () => {
    expect(queryToText(query, fields)).toBe(
      "Name contains “Acme” and (Seats is between 5 and 9 or Plan is any of Free, Team) and Active is Yes",
    );
    expect(queryToText({ operator: "and", conditions: [] }, fields)).toBe("");
  });

  it("uses the translate function for every word", () => {
    expect(
      conditionToText(
        { field: "seats", operator: "gt", value: 3 },
        fields[1],
        (id) => `<${id}>`,
      ),
    ).toBe("Seats <op.gt> 3");
  });
});

describe("JSON", () => {
  it("drops ids by default so equal queries serialize equally", () => {
    const query: QueryGroup = {
      id: "g",
      operator: "and",
      conditions: [{ id: "c", field: "name", operator: "is", value: "x" }],
    };

    expect(queryToJSON(query)).toBe(
      '{"operator":"and","conditions":[{"field":"name","operator":"is","value":"x"}]}',
    );
    expect(queryFromJSON(queryToJSON(query, { ids: true }))).toEqual(query);
    expect(
      countConditions({
        operator: "and",
        conditions: [query, query.conditions[0]],
      }),
    ).toBe(2);
  });

  it.each([
    [{ operator: "xor", conditions: [] }, /query/],
    [
      { operator: "and", conditions: [{ field: "a" }] },
      /query\.conditions\[0\]/,
    ],
    [
      {
        operator: "and",
        conditions: [{ operator: "or", conditions: [{ operator: 1 }] }],
      },
      /conditions\[0\]\.conditions\[0\]/,
    ],
  ])("rejects %j, naming the path", (input, path) => {
    expect(() => queryFromJSON(input)).toThrow(path);
  });
});
