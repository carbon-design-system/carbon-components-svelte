import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderActionClose from "./HeaderActionClose.test.svelte";

describe("HeaderAction close event", () => {
  const getActionButton = () =>
    screen.getByRole("button", { name: "Switcher" });

  it('dispatches close with trigger "toggle" when the button closes the panel', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    render(HeaderActionClose, { props: { onOpen, onClose } });

    await user.click(getActionButton());
    expect(getActionButton()).toHaveClass("bx--header__action--active");
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].detail).toEqual({ trigger: "toggle" });

    await user.click(getActionButton());
    expect(getActionButton()).not.toHaveClass("bx--header__action--active");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "toggle" });
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(HeaderActionClose, { props: { onClose } });

    await user.click(getActionButton());
    expect(getActionButton()).toHaveClass("bx--header__action--active");

    await user.click(screen.getByTestId("outside"));
    expect(getActionButton()).not.toHaveClass("bx--header__action--active");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });

  it("does not dispatch close on outside click when preventCloseOnClickOutside is set", async () => {
    const onClose = vi.fn();
    render(HeaderActionClose, {
      props: { onClose, preventCloseOnClickOutside: true },
    });

    await user.click(getActionButton());
    expect(getActionButton()).toHaveClass("bx--header__action--active");

    await user.click(screen.getByTestId("outside"));
    expect(getActionButton()).toHaveClass("bx--header__action--active");
    expect(onClose).not.toHaveBeenCalled();
  });
});
