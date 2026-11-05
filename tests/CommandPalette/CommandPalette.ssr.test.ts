// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import CommandPalette from "./CommandPalette.test.svelte";

describe("CommandPalette (SSR)", () => {
  it("renders an open palette with its commands and the first highlighted", () => {
    const { document } = renderSSR(CommandPalette, { open: true });

    const root = document.querySelector(".bx--command-palette");
    expect(root?.classList.contains("bx--command-palette--open")).toBe(true);
    expect(root?.hasAttribute("inert")).toBe(false);
    const options = [...document.querySelectorAll('[role="option"]')];
    expect(
      options.map(
        (option) =>
          option.querySelector(".bx--command-palette__item-text")?.textContent,
      ),
    ).toEqual([
      "Deploy service",
      "View logs",
      "Edit environment",
      "Delete service",
    ]);
    expect(options[0].id).toMatch(/-option-0$/);
    // Both platforms' key caps ship in the server HTML; CSS shows one.
    expect(options[0].querySelectorAll(".bx--kbd__platform")).toHaveLength(2);
    const input = document.querySelector('[role="combobox"]');
    expect(input?.getAttribute("aria-activedescendant")).toBe(options[0].id);
  });

  it("renders the empty text for no commands", () => {
    const { document } = renderSSR(CommandPalette, { open: true, items: [] });

    expect(
      document.querySelector(".bx--list-box__menu-status")?.textContent?.trim(),
    ).toBe("No commands available");
  });

  it("renders a closed palette inert, without rows", () => {
    const { document } = renderSSR(CommandPalette, { open: false });

    const root = document.querySelector(".bx--command-palette");
    expect(root?.hasAttribute("inert")).toBe(true);
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(0);
  });
});
