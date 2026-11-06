// @vitest-environment node
import { expandSearchIndex } from "../../docs/src/search-index";

describe("expandSearchIndex", () => {
  it("rebuilds a page's document and its sections', numbering repeated headings", () => {
    expect(
      expandSearchIndex([
        ["Tabs", "Tabs switch views.", "", "", ["Basic", "Sizes", "Basic"]],
      ]),
    ).toEqual([
      {
        id: "Tabs-page",
        text: "Tabs",
        description: "Tabs",
        summary: "Tabs switch views.",
        href: "/components/Tabs",
        isComponent: true,
      },
      {
        id: "Tabsbasic",
        text: "Tabs",
        description: "Basic",
        href: "/components/Tabs#basic",
        isComponent: false,
      },
      {
        id: "Tabssizes",
        text: "Tabs",
        description: "Sizes",
        href: "/components/Tabs#sizes",
        isComponent: false,
      },
      {
        id: "Tabsbasic-1",
        text: "Tabs",
        description: "Basic",
        href: "/components/Tabs#basic-1",
        isComponent: false,
      },
    ]);
  });
});
