import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import OverflowMenuClose from "./OverflowMenuClose.test.svelte";

describe("OverflowMenu close event trigger", () => {
  it('dispatches close with trigger "escape-key" from the trigger button', async () => {
    const onClose = vi.fn();
    render(OverflowMenuClose, { props: { onClose } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(OverflowMenuClose, { props: { onClose } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(document.body);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });

  it('dispatches close with trigger "toggle" when the trigger click closes an open menu', async () => {
    const onClose = vi.fn();
    render(OverflowMenuClose, { props: { onClose } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "toggle" });
  });

  it("preventDefault on the close event cancels the close (cancelable contract)", async () => {
    const onClose = vi.fn();
    render(OverflowMenuClose, { props: { onClose, cancelClose: true } });

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
    // Close was canceled: the menu stays open.
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });
});
