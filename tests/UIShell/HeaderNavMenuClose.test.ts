import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderNavMenuClose from "./HeaderNavMenubar.test.svelte";

const items = [
  { text: "Outside Link" },
  {
    text: "Menu",
    items: [{ text: "Menu Item 1" }, { text: "Menu Item 2" }],
  },
];
const defaults = { items, after: "button" } as const;

describe("HeaderNavMenu close event", () => {
  it('dispatches close with trigger "escape-key" from the trigger', async () => {
    const onClose = vi.fn();
    render(HeaderNavMenuClose, { props: { ...defaults, onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    await user.click(menuTrigger);
    expect(menuTrigger).toHaveAttribute("aria-expanded", "true");
    expect(menuTrigger).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith("Menu", "escape-key");
  });

  it('dispatches close with trigger "escape-key" from a menu item', async () => {
    const onClose = vi.fn();
    render(HeaderNavMenuClose, { props: { ...defaults, onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Menu Item 1" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith("Menu", "escape-key");
  });

  it("lets Tab move focus past the menu when leaving the last item", async () => {
    const onClose = vi.fn();
    render(HeaderNavMenuClose, { props: { ...defaults, onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Menu Item 2" })).toHaveFocus();

    await user.tab();

    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledWith("Menu", "blur");
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(HeaderNavMenuClose, { props: { ...defaults, onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard(" ");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("menuitem", { name: "Outside Link" }));
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith("Menu", "outside-click");
  });

  it("closes and returns focus to the trigger after Enter on a menu item", async () => {
    render(HeaderNavMenuClose, { props: defaults });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Menu Item 1" })).toHaveFocus();

    await user.keyboard("{Enter}");
    await tick();

    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(menuTrigger).toHaveFocus();
  });

  it("returns focus to the trigger after clicking a menu item", async () => {
    render(HeaderNavMenuClose, { props: defaults });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard(" ");
    await user.click(screen.getByRole("menuitem", { name: "Menu Item 1" }));
    await tick();

    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(menuTrigger).toHaveFocus();
  });

  it("does not dispatch close on outside clicks while collapsed", async () => {
    const onClose = vi.fn();
    render(HeaderNavMenuClose, { props: { ...defaults, onClose } });

    await user.click(screen.getByRole("menuitem", { name: "Outside Link" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
