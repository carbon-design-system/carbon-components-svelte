// @vitest-environment node
import { filterSettings } from "carbon-components-svelte/SettingsPage/filter-settings.js";

const sections = [
  {
    id: "profile",
    title: "Profile",
    items: [
      {
        id: "name",
        label: "Display name",
        description: "Shown next to your comments.",
        keywords: ["nickname"],
      },
      { id: "zone", label: "Time zone" },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    keywords: ["email"],
    items: [
      { id: "digest", label: "Digest frequency" },
      { id: "billing", label: "Billing alerts" },
    ],
  },
];

function shown(query: string) {
  const result = filterSettings(sections, query);
  return result.sections.flatMap((section) =>
    section.items.filter((item) => item.matched).map((item) => item.id),
  );
}

describe("filterSettings", () => {
  it("shows everything for an empty query", () => {
    const result = filterSettings(sections, "  ");
    expect(result.count).toBe(4);
    expect(result.sections.every((section) => section.matched)).toBe(true);
  });

  it("matches a label and returns the characters to highlight", () => {
    const result = filterSettings(sections, "zone");
    expect(shown("zone")).toEqual(["zone"]);
    expect(result.sections[0].items[1].labelIndices).toEqual([5, 6, 7, 8]);
    expect(result.sections[1].matched).toBe(false);
  });

  it("matches a description and a keyword the label lacks", () => {
    expect(shown("comments")).toEqual(["name"]);
    expect(shown("nickname")).toEqual(["name"]);
  });

  it("shows every item of a section whose title or keywords match", () => {
    expect(shown("notifications")).toEqual(["digest", "billing"]);
    expect(shown("email")).toEqual(["digest", "billing"]);
  });

  it("needs every word, which may match across an item and its section", () => {
    expect(shown("email digest")).toEqual(["digest"]);
    expect(shown("email nickname")).toEqual([]);
  });

  it("ignores a scattered subsequence by default", () => {
    expect(shown("dnm")).toEqual([]);
    expect(
      filterSettings(sections, "dnm", { threshold: 0 }).count,
    ).toBeGreaterThan(0);
  });

  it("reports no results", () => {
    const result = filterSettings(sections, "zzz");
    expect(result.count).toBe(0);
    expect(result.sections.some((section) => section.matched)).toBe(false);
  });
});
