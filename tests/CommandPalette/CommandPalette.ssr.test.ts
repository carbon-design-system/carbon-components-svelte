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
    expect(options.map((option) => option.textContent?.trim())).toEqual([
      "Deploy serviceCtrlD",
      "View logs",
      "Edit environmentVariables and secrets",
      "Delete service",
    ]);
    const input = document.querySelector('[role="combobox"]');
    expect(input?.getAttribute("aria-activedescendant")).toBe(options[0].id);
  });

  it("renders a closed palette inert, without rows", () => {
    const { document } = renderSSR(CommandPalette, { open: false });

    const root = document.querySelector(".bx--command-palette");
    expect(root?.hasAttribute("inert")).toBe(true);
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(0);
  });
});
