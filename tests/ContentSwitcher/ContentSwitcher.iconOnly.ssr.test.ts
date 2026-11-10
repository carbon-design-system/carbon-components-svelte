// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import IconOnly from "./ContentSwitcher.iconOnly.test.svelte";
import IconOnlyMixed from "./ContentSwitcher.iconOnlyMixed.test.svelte";

// Each icon switch marks itself `--icon` as it renders. The icon-only
// styles key on that mark, the switcher's width through `:has()`, so the
// server markup has the right widths and a visible selected icon.
describe("ContentSwitcher icon switches, server-rendered", () => {
  it("marks every icon switch", () => {
    const { document } = renderSSR(IconOnly, {});
    const switches = [
      ...document.querySelectorAll(".bx--content-switcher-btn"),
    ];

    expect(switches).toHaveLength(3);
    for (const button of switches)
      expect(button).toHaveClass("bx--content-switcher-btn--icon");
  });

  it("marks only the switches with an icon", () => {
    const { document } = renderSSR(IconOnlyMixed, {});
    const byLabel = (label: string) =>
      document.querySelector(
        `.bx--content-switcher-btn[aria-label="${label}"]`,
      );

    expect(byLabel("Table of contents")).toHaveClass(
      "bx--content-switcher-btn--icon",
    );
    expect(byLabel("Dashboard")).toHaveClass("bx--content-switcher-btn--icon");
    // No icon, so no aria-label: found by its text instead.
    const plain = [
      ...document.querySelectorAll(".bx--content-switcher-btn"),
    ].find((button) => button.textContent?.includes("Plain"));
    expect(plain).toBeDefined();
    expect(plain).not.toHaveClass("bx--content-switcher-btn--icon");
  });
});
