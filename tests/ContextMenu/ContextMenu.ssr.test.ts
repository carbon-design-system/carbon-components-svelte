// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ContextMenuOptionShortcut from "./ContextMenuOption.shortcut.test.svelte";
import ContextMenu from "./ContextMenuSsr.test.svelte";

describe("ContextMenu server render", () => {
  it.each([false, true])(
    "marks each option's menu level without a DOM ref (open: %s)",
    (open) => {
      const { document } = renderSSR(ContextMenu, { open });
      const nested = (label: string) =>
        [...document.querySelectorAll("li")]
          .find(
            (item) =>
              item.getAttribute("role") === "menuitem" &&
              item.textContent?.trim() === label,
          )
          ?.getAttribute("data-nested");

      expect(nested("Copy")).toBe("false");
      expect(nested("Nested")).toBe("true");
    },
  );
});

describe("ContextMenuOption shortcut server render", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the non-Apple form and aria-keyshortcuts, even under an Apple navigator", () => {
    // Node 21+ defines `navigator`, so reading it on the server would
    // render the developer's platform and then mismatch the client.
    vi.stubGlobal("navigator", { platform: "MacIntel" });

    const { document } = renderSSR(ContextMenuOptionShortcut);

    const option = document.querySelector("[aria-keyshortcuts]");
    expect(option).toHaveAttribute("aria-keyshortcuts", "Control+Shift+P");
    expect(option?.querySelector(".bx--keyboard-shortcut")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(option?.textContent).toContain("Ctrl");
    expect(option?.textContent).not.toContain("⌘");
  });
});
