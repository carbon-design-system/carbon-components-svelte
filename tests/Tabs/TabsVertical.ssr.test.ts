// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import TabsVertical from "./TabsVertical.test.svelte";
import TabsVerticalSelectedId from "./TabsVerticalSelectedId.test.svelte";

function selectedStates(document: Document) {
  return {
    tabs: [...document.querySelectorAll("[role='tab']")].map((tab) =>
      tab.getAttribute("aria-selected"),
    ),
    panels: [...document.querySelectorAll("[role='tabpanel']")].map(
      (panel) => !panel.hasAttribute("hidden"),
    ),
  };
}

describe("TabsVertical server render", () => {
  it("renders the `selected` tab and panel as selected", () => {
    const { document } = renderSSR(TabsVertical, { selected: 2 });

    expect(selectedStates(document)).toEqual({
      tabs: ["false", "false", "true", "false"],
      panels: [false, false, true, false],
    });
  });

  it("renders the `selectedId` tab and panel as selected", () => {
    const { document } = renderSSR(TabsVerticalSelectedId, {
      selectedId: "tab-c",
    });

    expect(selectedStates(document)).toEqual({
      tabs: ["false", "false", "true"],
      panels: [false, false, true],
    });
  });
});
