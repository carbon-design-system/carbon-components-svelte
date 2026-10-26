// @vitest-environment node
import {
  colorTokens,
  componentTokens,
  typeTokens,
} from "carbon-components-svelte/tokens";
import {
  COLOR_GROUPS,
  colorGroups,
  COMPONENT_GROUPS,
  filterGroups,
  groupMatches,
  groupNames,
  normalizeQuery,
  remToPx,
  TYPE_GROUPS,
} from "../../docs/src/token-reference";

describe("token reference grouping", () => {
  it.each([
    ["color", COLOR_GROUPS, Object.keys(colorTokens)],
    ["component", COMPONENT_GROUPS, Object.keys(componentTokens)],
    ["type", TYPE_GROUPS, Object.keys(typeTokens)],
  ])("puts every %s token in exactly one group", (_, groups, names) => {
    const { groups: grouped, ungrouped } = groupNames(groups, names);

    // A new token needs a group in docs/src/token-reference.ts.
    expect(ungrouped).toEqual([]);
    expect([...grouped.values()].flat().sort()).toEqual([...names].sort());
    for (const name of names) {
      expect(
        groups.filter((group) => groupMatches(group, name)).map((g) => g.id),
        name,
      ).toHaveLength(1);
    }
    for (const [id, members] of grouped) {
      expect(members.length, id).toBeGreaterThan(0);
    }
  });

  it("reports a token no group matches", () => {
    expect(groupNames(COLOR_GROUPS, ["layer-01", "brand-new"])).toEqual({
      groups: expect.any(Map),
      ungrouped: ["brand-new"],
    });
  });
});

describe("token reference search", () => {
  const valuesOf = (row: (typeof colorGroups)[number]["rows"][number]) =>
    Object.values(row.values);

  it.each([
    ["var(--cds-layer-01)", "layer-01"],
    ["$Layer-01", "layer-01"],
    ["--cds-focus", "focus"],
    ["rgba(141, 141, 141, 0.5)", "rgba(141,141,141,0.5)"],
  ])("normalizes %s", (query, normalized) => {
    expect(normalizeQuery(query)).toBe(normalized);
  });

  it("matches by name or by any theme's value", () => {
    const byName = filterGroups(colorGroups, "layer-accent-03", valuesOf);
    expect(
      byName.flatMap((group) => group.rows.map((row) => row.name)),
    ).toEqual(["layer-accent-03"]);

    const byValue = filterGroups(
      colorGroups,
      normalizeQuery("rgba(141, 141, 141, 0.5)"),
      valuesOf,
    );
    const rows = byValue.flatMap((group) => group.rows);
    expect(rows.map((row) => row.name)).toContain("background-active");
    for (const row of rows) {
      expect(Object.values(row.values), row.name).toContain(
        "rgba(141, 141, 141, 0.5)",
      );
    }
  });

  it("converts rem to pixels", () => {
    expect(remToPx("0.125rem")).toBe("2px");
    expect(remToPx("10vw")).toBeUndefined();
  });
});
