// @vitest-environment node
import {
  conditionsToQuery,
  keysToQueryFields,
  queryToConditions,
} from "../../src/TokenSearch/query-conditions.js";
import {
  formatQuery,
  parseQuery,
  type TokenKey,
} from "../../src/TokenSearch/token-query.js";

const keys: TokenKey[] = [
  { key: "is", label: "State", type: "enum", values: ["open", "closed"] },
  {
    key: "label",
    type: "enum",
    values: [{ value: "bug", label: "Bug" }, "ui", "wontfix"],
  },
  { key: "author", type: "user" },
  { key: "assignee", type: "user", values: ["alice", "bob"] },
  { key: "created", type: "date" },
  { key: "comments", type: "number" },
  { key: "title", type: "text" },
];
const now = new Date(2026, 10, 3);
const parse = (text: string) => parseQuery(text, { keys, now });

describe("keysToQueryFields", () => {
  it("maps a key to a field of the matching kind", () => {
    expect(keysToQueryFields(keys)).toEqual([
      {
        id: "is",
        label: "State",
        kind: "option",
        options: [
          { id: "open", text: "open" },
          { id: "closed", text: "closed" },
        ],
      },
      {
        id: "label",
        label: "label",
        kind: "option",
        options: [
          { id: "bug", text: "Bug" },
          { id: "ui", text: "ui" },
          { id: "wontfix", text: "wontfix" },
        ],
      },
      { id: "author", label: "author", kind: "text" },
      {
        id: "assignee",
        label: "assignee",
        kind: "option",
        options: [
          { id: "alice", text: "alice" },
          { id: "bob", text: "bob" },
        ],
      },
      { id: "created", label: "created", kind: "date" },
      { id: "comments", label: "comments", kind: "number" },
      { id: "title", label: "title", kind: "text" },
    ]);
  });
});

describe("queryToConditions", () => {
  it("makes an and group of the filters and hands back the free text", () => {
    const { group, text, skipped } = queryToConditions(
      parse(
        'is:open -label:wontfix label:bug,ui comments:>=5 created:>2026-01-01 title:crash author:alice "two words"',
      ),
      keys,
    );
    expect(group).toEqual({
      operator: "and",
      conditions: [
        { field: "is", operator: "is", value: "open" },
        { field: "label", operator: "isNot", value: "wontfix" },
        { field: "label", operator: "isAnyOf", value: ["bug", "ui"] },
        { field: "comments", operator: "gte", value: 5 },
        { field: "created", operator: "after", value: "2026-01-01" },
        { field: "title", operator: "contains", value: "crash" },
        { field: "author", operator: "contains", value: "alice" },
      ],
    });
    expect(text).toBe("two words");
    expect(skipped).toEqual([]);
  });

  it("turns a range into between, and a negated one into two tests", () => {
    const nodes = (text: string) =>
      queryToConditions(parse(text), keys).group.conditions;
    expect(nodes("comments:3..10")).toEqual([
      { field: "comments", operator: "between", value: [3, 10] },
    ]);
    expect(nodes("-comments:3..10")).toEqual([
      {
        operator: "or",
        conditions: [
          { field: "comments", operator: "lt", value: 3 },
          { field: "comments", operator: "gt", value: 10 },
        ],
      },
    ]);
    expect(nodes("comments:3..")).toEqual([
      { field: "comments", operator: "gte", value: 3 },
    ]);
    expect(nodes("-comments:..10")).toEqual([
      { field: "comments", operator: "gt", value: 10 },
    ]);
    expect(nodes("-comments:>=5")).toEqual([
      { field: "comments", operator: "lt", value: 5 },
    ]);
  });

  it("turns a list on a field without any-of into an or group", () => {
    expect(
      queryToConditions(parse("title:a,b"), keys).group.conditions,
    ).toEqual([
      {
        operator: "or",
        conditions: [
          { field: "title", operator: "contains", value: "a" },
          { field: "title", operator: "contains", value: "b" },
        ],
      },
    ]);
  });

  it("skips a filter with an error or an unknown key", () => {
    const { group, skipped } = queryToConditions(
      parse("is:merged nope:1 is:open comments:abc"),
      keys,
    );
    expect(group.conditions).toEqual([
      { field: "is", operator: "is", value: "open" },
    ]);
    expect(skipped.map((filter) => filter.key)).toEqual([
      "is",
      "nope",
      "comments",
    ]);
  });
});

describe("conditionsToQuery", () => {
  it("round trips the filters of a query", () => {
    const sources = [
      "is:open -label:wontfix label:bug,ui comments:>=5 created:>2026-01-01 title:crash",
      "comments:3..10 -comments:3..10 created:2026-01-01..2026-02-01",
      "-label:bug,ui is:closed",
      "title:a,b assignee:alice,bob",
      "comments:<5 created:<=2026-05-05",
    ];
    for (const source of sources) {
      const query = parse(source);
      const { group, skipped } = queryToConditions(query, keys);
      expect(skipped).toEqual([]);
      const back = conditionsToQuery(group, keys);
      expect(back.skipped).toEqual([]);
      expect(back.value).toBe(formatQuery(query));
    }
  });

  it("writes a negated comparison as its opposite", () => {
    const { group } = queryToConditions(parse("-comments:>=5"), keys);
    expect(conditionsToQuery(group, keys).value).toBe("comments:<5");
  });

  it("writes free text after the filters", () => {
    const { value } = conditionsToQuery(
      {
        operator: "and",
        conditions: [{ field: "is", operator: "is", value: "open" }],
      },
      keys,
      { text: "crash on save" },
    );
    expect(value).toBe("is:open crash on save");
  });

  it("flattens a nested and group and a single-child or group", () => {
    const { value, skipped } = conditionsToQuery(
      {
        operator: "and",
        conditions: [
          {
            operator: "and",
            conditions: [{ field: "is", operator: "is", value: "open" }],
          },
          {
            operator: "or",
            conditions: [{ field: "comments", operator: "gt", value: 2 }],
          },
        ],
      },
      keys,
    );
    expect(value).toBe("is:open comments:>2");
    expect(skipped).toEqual([]);
  });

  it("returns what a query cannot say", () => {
    const startsWith = { field: "title", operator: "startsWith", value: "x" };
    const empty = { field: "is", operator: "isEmpty", value: null };
    const unknown = { field: "nope", operator: "is", value: "1" };
    const acrossFields = {
      operator: "or" as const,
      conditions: [
        { field: "is", operator: "is", value: "open" },
        { field: "label", operator: "is", value: "bug" },
      ],
    };
    const { value, skipped } = conditionsToQuery(
      {
        operator: "and",
        conditions: [
          startsWith,
          empty,
          unknown,
          acrossFields,
          { field: "is", operator: "is", value: "closed" },
        ],
      },
      keys,
    );
    expect(value).toBe("is:closed");
    expect(skipped).toEqual([startsWith, empty, unknown, acrossFields]);
  });
});
