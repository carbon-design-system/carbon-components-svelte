import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import MenuShortcut from "./MenuShortcut.test.svelte";

const keys = (root: Element | null) =>
  [
    ...(root?.querySelectorAll(".bx--kbd__platform--other .bx--kbd__key") ??
      []),
  ].map((key) => key.textContent);

describe("Menu item shortcuts", () => {
  it("show muted keys and set aria-keyshortcuts on MenuItem", () => {
    render(MenuShortcut);
    const save = screen.getByTestId("save");

    expect(save).toHaveAttribute("aria-keyshortcuts", "Control+S");
    expect(keys(save.querySelector(".bx--menu-option__info"))).toEqual([
      "Ctrl",
      "S",
    ]);
    expect(save.querySelector(".bx--kbd")).toHaveClass("bx--kbd--muted");
    expect(save.querySelector(".bx--kbd")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("let shortcutText take precedence", () => {
    render(MenuShortcut);

    for (const [id, text] of [
      ["custom", "F5"],
      ["paste", "Paste key"],
    ]) {
      const option = screen.getByTestId(id);
      expect(option.querySelector(".bx--kbd")).toBeNull();
      expect(option.querySelector(".bx--menu-option__info")).toHaveTextContent(
        text,
      );
    }
  });

  it("show a shortcut that doesn't parse as written", async () => {
    render(MenuShortcut);
    await tick();
    const options = [
      ["free-text", "⌘C"],
      ["context-free-text", "⌘X"],
    ].map(([id, text]) => [screen.getByTestId(id), text] as const);
    const overflow = screen.getByTestId("overflow-free-text");
    const overflowButton = overflow.querySelector('[role="menuitem"]');

    for (const [option, text] of options) {
      expect(option.querySelector(".bx--kbd")).toBeNull();
      expect(option.querySelector(".bx--menu-option__info")).toHaveTextContent(
        text,
      );
      expect(option).not.toHaveAttribute("aria-keyshortcuts");
    }
    expect(overflow.querySelector(".bx--kbd")).toBeNull();
    expect(
      overflow.querySelector(".bx--overflow-menu-options__option-shortcut"),
    ).toHaveTextContent("⌘D");
    expect(overflowButton).not.toHaveAttribute("aria-keyshortcuts");
  });

  it("show keys on ContextMenuOption", () => {
    render(MenuShortcut);
    const copy = screen.getByTestId("copy");

    expect(copy).toHaveAttribute("aria-keyshortcuts", "Control+C");
    expect(keys(copy)).toEqual(["Ctrl", "C"]);
  });

  it("widen an OverflowMenu whose items show keys", async () => {
    render(MenuShortcut);
    await tick();
    const edit = screen.getByTestId("edit");
    const menuItem = edit.querySelector('[role="menuitem"]');

    expect(menuItem).toHaveAttribute("aria-keyshortcuts", "Control+E");
    expect(keys(edit)).toEqual(["Ctrl", "E"]);
    expect(edit.closest(".bx--overflow-menu-options")).toHaveClass(
      "bx--overflow-menu-options--shortcuts",
    );
  });
});
