import { render, screen } from "@testing-library/svelte";
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

  it("does not dispatch close on outside clicks while collapsed", async () => {
    const onClose = vi.fn();
    render(HeaderNavMenuClose, { props: { onClose } });

    await user.click(screen.getByRole("menuitem", { name: "Outside Link" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
