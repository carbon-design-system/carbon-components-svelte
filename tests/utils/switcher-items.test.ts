import {
  buildSwitcherSections,
  matchesSwitcherQuery,
  pushRecentId,
} from "../../src/utils/switcher-items.js";

const items = [
  { id: 1, text: "Acme Corp", description: "Engineering", group: "Accounts" },
  { id: 2, text: "Cloud console", group: "Apps" },
  { id: 3, text: "Zoë Personal", description: "zoe@example.com" },
  { id: 4, text: "Globex", group: "Accounts" },
];

describe("matchesSwitcherQuery", () => {
  it("needs every word, in the text or the description, ignoring case and accents", () => {
    expect(matchesSwitcherQuery(items[0], "ENG acme")).toBe(true);
    expect(matchesSwitcherQuery(items[0], "acme sales")).toBe(false);
    expect(matchesSwitcherQuery(items[2], "zoe")).toBe(true);
    expect(matchesSwitcherQuery(items[2], "  ")).toBe(true);
  });
});

describe("buildSwitcherSections", () => {
  it("puts ungrouped items first, then groups in order of first appearance", () => {
    const sections = buildSwitcherSections({ items, query: "" });

    expect(sections.map((s) => [s.heading, s.items.map((i) => i.id)])).toEqual([
      [undefined, [3]],
      ["Accounts", [1, 4]],
      ["Apps", [2]],
    ]);
  });

  it("keeps only matches, and drops a group with none", () => {
    const sections = buildSwitcherSections({ items, query: "glo" });

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("Accounts");
    expect(sections[0].items.map((i) => i.id)).toEqual([4]);
  });

  it("takes a custom matcher", () => {
    const sections = buildSwitcherSections({
      items,
      query: "anything",
      matches: (item) => item.id === 2,
    });

    expect(sections.flatMap((s) => s.items.map((i) => i.id))).toEqual([2]);
  });
});

describe("recent section", () => {
  const recentOptions = { items, query: "", recentLimit: 2 };

  it("comes first, in recent order, without the current item or ids that are gone", () => {
    const sections = buildSwitcherSections({
      ...recentOptions,
      recentIds: [4, 99, 1, 2],
      selectedId: 4,
    });

    expect(sections[0].key).toBe("recent");
    expect(sections[0].items.map((i) => i.id)).toEqual([1, 2]);
  });

  it("moves recent items out of their groups", () => {
    const sections = buildSwitcherSections({
      ...recentOptions,
      recentIds: [4],
    });

    const ids = sections.flatMap((s) => s.items.map((i) => i.id));
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(sections.find((s) => s.heading === "Accounts")?.items).toEqual([
      items[0],
    ]);
  });

  it("is off without recentIds and while a query is typed", () => {
    expect(
      buildSwitcherSections({ ...recentOptions, recentIds: undefined }).some(
        (s) => s.key === "recent",
      ),
    ).toBe(false);
    expect(
      buildSwitcherSections({
        ...recentOptions,
        query: "a",
        recentIds: [1],
      }).some((s) => s.key === "recent"),
    ).toBe(false);
  });
});

describe("pushRecentId", () => {
  it("puts the account that was left first and drops the one chosen", () => {
    expect(pushRecentId([2, 3, 4], 1, 3, 5)).toEqual([1, 2, 4]);
  });

  it("keeps the list within the limit", () => {
    expect(pushRecentId([2, 3, 4], 1, 9, 3)).toEqual([1, 2, 3]);
  });

  it("only drops the chosen one when nothing was current", () => {
    expect(pushRecentId([2, 3], undefined, 3, 5)).toEqual([2]);
  });
});
