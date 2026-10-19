// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import { expectSelected } from "./ssr-helpers";
import TabsSecondaryLabel from "./TabsSecondaryLabelSsr.test.svelte";
import TabsSelectedId from "./TabsSelectedId.test.svelte";
import TabsVertical from "./TabsVertical.test.svelte";

describe("TabsVertical server render", () => {
  it("renders the `selected` tab and panel as selected", () => {
    const { document } = renderSSR(TabsVertical, { selected: 2 });

    expectSelected(document, 2, 4);
  });

  it("renders the `selectedId` tab and panel as selected", () => {
    const { document } = renderSSR(TabsSelectedId, {
      selectedId: "tab-c",
      vertical: true,
    });

    expectSelected(document, 2);
  });

  it("draws a tab's own secondary label", () => {
    const { document } = renderSSR(TabsSecondaryLabel, { type: "vertical" });
    const [, details] = [...document.querySelectorAll(".bx--tabs__nav-item")];

    expect(details).toHaveClass("bx--tabs__nav-item--secondary-label");
    expect(
      details.querySelector(".bx--tabs__nav-item-secondary-label"),
    ).toHaveTextContent("(3)");
  });
});
