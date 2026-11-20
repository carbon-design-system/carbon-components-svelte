import {
  facetsFromText,
  fromSearchParams,
  mergeOptions,
  resolveRange,
  schemaFromFields,
  textWithFacets,
  toAuditQuery,
  toSearchParams,
} from "../../src/AuditLogExplorer/audit-state";
import { fromFilters, toFilters } from "../../src/FilterPanel/filter-model";
import { formatQuery, parseQuery } from "../../src/TokenSearch/token-query";

const fields = [
  {
    key: "outcome",
    label: "Outcome",
    facet: true,
    values: ["success", "failure", "denied"],
  },
  {
    key: "action",
    label: "Action",
    facet: true,
    values: ["iam.user.login", "iam.policy.update", "storage.object.read"],
  },
  {
    key: "actor",
    label: "Actor",
    facet: true,
    values: ["alice", "bob", "svc-ci"],
  },
  { key: "target", label: "Target" },
];
const { keys, facets } = schemaFromFields(fields);

describe("one list of fields, two schemas", () => {
  it("makes enum keys for faceted fields and text keys for the rest", () => {
    expect(keys.map((k) => [k.key, k.type])).toEqual([
      ["outcome", "enum"],
      ["action", "enum"],
      ["actor", "enum"],
      ["target", "text"],
    ]);
    expect(facets.map((f) => f.id)).toEqual(["outcome", "action", "actor"]);
  });
});

describe("facets and the query text edit one model", () => {
  it("reads a facet state out of the text", () => {
    const { state, rest } = facetsFromText(
      "deploy outcome:failure,denied target:bucket",
      facets,
      keys,
    );
    expect(state).toEqual({ outcome: ["failure", "denied"] });
    expect(rest.map((f) => f.key)).toEqual(["target"]);
  });

  it("writes a facet change into the text and keeps what else was typed in place", () => {
    const text = 'deploy target:bucket/00 "exact phrase"';
    const next = textWithFacets(text, facets, { outcome: ["denied"] }, keys);
    expect(next).toBe('deploy target:bucket/00 "exact phrase" outcome:denied');
    // Changing the facet again keeps its place.
    const again = textWithFacets(
      `outcome:denied ${text}`,
      facets,
      { outcome: ["denied", "failure"] },
      keys,
    );
    expect(again).toBe(
      'outcome:denied,failure deploy target:bucket/00 "exact phrase"',
    );
    // Emptying the facet removes only its qualifier.
    expect(textWithFacets(again, facets, {}, keys)).toBe(
      'deploy target:bucket/00 "exact phrase"',
    );
  });

  it("round trips every combination of the three facets", () => {
    const outcome = [undefined, ["success"], ["failure", "denied"]];
    const action = [
      undefined,
      ["iam.user.login"],
      ["iam.policy.update", "storage.object.read"],
    ];
    const actor = [undefined, ["svc-ci"], ["alice", "bob"]];
    for (const o of outcome)
      for (const a of action)
        for (const u of actor) {
          const state = Object.fromEntries(
            Object.entries({ outcome: o, action: a, actor: u }).filter(
              ([, v]) => v,
            ),
          );
          const text = textWithFacets("free target:x", facets, state, keys);
          expect(facetsFromText(text, facets, keys).state).toEqual(state);
          // And the text is stable: writing the same state again changes nothing.
          expect(textWithFacets(text, facets, state, keys)).toBe(text);
        }
  });

  it("leaves a qualifier no facet can show in the text", () => {
    const text = "-outcome:success actor:alice actor:bob action:>x";
    const { state, rest } = facetsFromText(text, facets, keys);
    // A negation, a repeated key (which is "and") and a value the facet has
    // no option for. The parser keeps that last one in `filters` with errors,
    // as an ordinary `eq`, so a facet edit would cut it without the option check.
    expect(state).toEqual({});
    expect(rest).toHaveLength(4);
    const next = textWithFacets(text, facets, { outcome: ["denied"] }, keys);
    expect(next).toContain("action:>x");
    expect(next).toContain("-outcome:success");
    expect(next).toContain("actor:alice actor:bob");
    expect(next).toContain("outcome:denied");
  });

  it("FilterPanel's own conversion would merge a repeated key into 'any of'", () => {
    // The reason `facetsFromText` keeps a repeated key out of the facets:
    // `actor:alice actor:bob` selects nothing (and), the facet shows both (or).
    const parsed = parseQuery("actor:alice actor:bob", { keys });
    const { state } = fromFilters(facets as never, parsed.filters);
    expect(state).toEqual({ actor: ["alice", "bob"] });
    expect(
      formatQuery({
        terms: [],
        filters: toFilters(facets as never, state) as never,
      }),
    ).toBe("actor:alice,bob");
  });

  it("turns a parsed query into a source query", () => {
    const query = parseQuery('deploy -"dry run" outcome:denied -actor:svc-ci', {
      keys,
    });
    expect(toAuditQuery(query)).toEqual({
      q: 'deploy -"dry run"',
      filters: [
        { key: "outcome", op: "eq", values: ["denied"], negated: false },
        { key: "actor", op: "eq", values: ["svc-ci"], negated: true },
      ],
    });
    // A qualifier the parser flagged is not sent: `root` is no actor in the schema.
    const flagged = parseQuery("outcome:denied actor:root", { keys });
    expect(flagged.filters).toHaveLength(2);
    expect(toAuditQuery(flagged).filters.map((f) => f.key)).toEqual([
      "outcome",
    ]);
  });
});

describe("option lists that grow from counts", () => {
  it("keeps the listed order, appends new values by count and never drops a selected one", () => {
    const listed = ["b", "a"];
    expect(mergeOptions(listed, { a: 9, b: 1 }, [])).toBe(listed);
    expect(mergeOptions(listed, { c: 1, d: 5, a: 9 }, ["z"])).toEqual([
      "b",
      "a",
      "d",
      "c",
      "z",
    ]);
  });
});

describe("the view state in the URL", () => {
  it("round trips a preset, a custom window and live", () => {
    const a = {
      q: "actor:alice deploy",
      range: { preset: "24h" as const },
      live: true,
    };
    expect(fromSearchParams(toSearchParams(a))).toEqual(a);
    const b = {
      q: "",
      range: { from: "2026-11-01T08:00", to: "2026-11-02T17:30" },
      live: false,
    };
    expect(toSearchParams(b).toString()).toBe(
      "from=2026-11-01T08%3A00&to=2026-11-02T17%3A30",
    );
    expect(fromSearchParams(toSearchParams(b))).toEqual(b);
  });

  it("leaves defaults out and falls back on anything that does not parse", () => {
    expect(
      toSearchParams({
        q: "",
        range: { preset: "7d" },
        live: false,
      }).toString(),
    ).toBe("");
    expect(fromSearchParams("range=forever&from=yesterday&live=yes")).toEqual({
      q: "",
      range: { preset: "7d" },
      live: false,
    });
    expect(fromSearchParams("range=__proto__").range).toEqual({ preset: "7d" });
    expect(fromSearchParams("from=2026-13-40T99:99").range).toEqual({
      preset: "7d",
    });
  });

  it("resolves a preset against now and a custom window to whole minutes", () => {
    const now = Date.parse("2026-11-04T12:00:00Z");
    expect(resolveRange({ preset: "1h" }, now)).toEqual({
      from: "2026-11-04T11:00:00.000Z",
      to: null,
    });
    expect(
      resolveRange({ from: "2026-11-01T08:00", to: "2026-11-01T08:05" }),
    ).toEqual({
      from: "2026-11-01T08:00:00.000Z",
      to: "2026-11-01T08:05:59.999Z",
    });
    expect(resolveRange({ from: "", to: "2026-11-01T08:05" }).from).toBeNull();
  });
});
