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
});
