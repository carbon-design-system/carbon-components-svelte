import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import { closeDetails, openMenu } from "./helpers";
import OverflowMenu from "./OverflowMenu.test.svelte";

describe("OverflowMenu close event trigger", () => {
  it('dispatches close with trigger "escape-key" when Escape is pressed on the trigger', async () => {
    const onClose = vi.fn();
    render(OverflowMenu, { props: { onClose, open: true } });

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    menuButton.focus();
    expect(menuButton).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();
    expect(closeDetails(onClose)).toEqual([{ trigger: "escape-key" }]);
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(OverflowMenu, { props: { onClose } });

    const { menuButton } = await openMenu();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(document.body);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(closeDetails(onClose)).toEqual([{ trigger: "outside-click" }]);
  });

  it('dispatches close with trigger "toggle" when the trigger click closes an open menu', async () => {
    const onClose = vi.fn();
    render(OverflowMenu, { props: { onClose } });

    const { menuButton } = await openMenu();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(closeDetails(onClose)).toEqual([{ trigger: "toggle" }]);
  });

  it("preventDefault on the close event cancels the close (cancelable contract)", async () => {
    const onClose = vi.fn();
    render(OverflowMenu, { props: { onClose, cancelClose: true } });

    const { menuButton } = await openMenu();
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(closeDetails(onClose)).toEqual([{ trigger: "escape-key" }]);
    // Close was canceled: the menu stays open.
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });
});
