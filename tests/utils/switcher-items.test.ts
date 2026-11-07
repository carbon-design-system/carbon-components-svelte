import {
  buildSwitcherSections,
  matchesSwitcherQuery,
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
