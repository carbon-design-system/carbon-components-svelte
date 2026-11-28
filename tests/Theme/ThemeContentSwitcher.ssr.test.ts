// @vitest-environment node
import ThemeContentSwitcher from "carbon-components-svelte/Theme/ThemeContentSwitcher.svelte";
import { renderSSR } from "../utils/ssr";

describe("ThemeContentSwitcher server render", () => {
  it("selects the current theme before hydration", () => {
    const { document } = renderSSR(ThemeContentSwitcher, {
      id: "theme",
      theme: "g90",
    });
    const tabs = [...document.querySelectorAll("[role='tab']")];

    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      "White",
      "Gray 10",
      "Gray 80",
      "Gray 90",
      "Gray 100",
    ]);
    expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual([
      "false",
      "false",
      "false",
      "true",
      "false",
    ]);
    expect(tabs[3]).toHaveAttribute("id", "theme-g90");
    expect(document.querySelector("[role='tablist']")).toHaveAttribute(
      "aria-labelledby",
      "theme-label",
    );
    expect(document.getElementById("theme-label")).toHaveTextContent("Themes");
  });
});
