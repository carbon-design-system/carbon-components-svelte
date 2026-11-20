// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import FocusNav from "./FocusNav.test.svelte";

describe("focusNav server render", () => {
  it("writes the tab stop on the first enabled item, with no browser", () => {
    const { document } = renderSSR(FocusNav);
    const stops = [...document.querySelectorAll("button")].map((button) =>
      button.getAttribute("tabindex"),
    );
    expect(stops).toEqual(["0", "-1", "-1", "-1", "-1"]);
  });

  it("writes no aria-activedescendant before a key moves the cursor", () => {
    const { document } = renderSSR(FocusNav, { mode: "activedescendant" });
    const list = document.querySelector("[role=listbox]");
    expect(list).not.toBeNull();
    expect(list?.hasAttribute("aria-activedescendant")).toBe(false);
  });
});
