import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderNavMenuClose from "./HeaderNavMenuClose.test.svelte";

describe("HeaderNavMenu close event", () => {
  it('dispatches close with trigger "escape-key" from the trigger', async () => {
    const onClose = vi.fn();
    render(HeaderNavMenuClose, { props: { onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard(" ");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
  });

  it('dispatches close with trigger "escape-key" from a menu item', async () => {
    const onClose = vi.fn();
    render(HeaderNavMenuClose, { props: { onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Menu Item 1" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
  });

  it("lets Tab move focus past the menu when leaving the last item", async () => {
    const onClose = vi.fn();
    render(HeaderNavMenuClose, { props: { onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Menu Item 2" })).toHaveFocus();

    await user.tab();

    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "blur" });
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(HeaderNavMenuClose, { props: { onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard(" ");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("menuitem", { name: "Outside Link" }));
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });

  it("collapses when clicking a link menu item", async () => {
    const onClose = vi.fn();
    render(HeaderNavMenuClose, { props: { onClose } });

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();
    await user.keyboard(" ");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("menuitem", { name: "Menu Item 1" }));
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes and returns focus to the trigger after Enter on a menu item", async () => {
    render(HeaderNavMenuClose);

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
    render(HeaderNavMenuClose);

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
    render(HeaderNavMenuClose, { props: { onClose } });

    await user.click(screen.getByRole("menuitem", { name: "Outside Link" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
