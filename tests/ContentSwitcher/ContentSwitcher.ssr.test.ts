// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ContentSwitcherSsr from "./ContentSwitcherSsr.test.svelte";

describe("ContentSwitcher server render", () => {
  it.each([0, 2])(
    "makes the selected switch (%i) the tab stop before hydration",
    (selectedIndex) => {
      const { document } = renderSSR(ContentSwitcherSsr, { selectedIndex });
      const switches = [...document.querySelectorAll("[role='tab']")];

      expect(switches).toHaveLength(3);
      switches.forEach((tab, index) => {
        expect(tab).toHaveAttribute(
          "tabindex",
          index === selectedIndex ? "0" : "-1",
        );
      });
    },
  );

  const panelState = (selectedIndex: number, selectedId?: string) => {
    const { document } = renderSSR(ContentSwitcherSsr, {
      selectedIndex,
      selectedId,
    });
    return [...document.querySelectorAll("[role='tabpanel']")].map(
      (panel) => !panel.hasAttribute("hidden"),
    );
  };

  it("shows only the selected switch's panel before hydration", () => {
    expect(panelState(0)).toEqual([true, false, false]);
    expect(panelState(2)).toEqual([false, false, true]);
    expect(panelState(0, "active")).toEqual([false, true, false]);
  });

  it("names each panel by its switch before hydration", () => {
    const { document } = renderSSR(ContentSwitcherSsr);
    const ids = [...document.querySelectorAll("[role='tab']")].map((t) => t.id);
    const labels = [...document.querySelectorAll("[role='tabpanel']")].map(
      (panel) => panel.getAttribute("aria-labelledby"),
    );

    expect(labels).toEqual(ids);
  });
});
