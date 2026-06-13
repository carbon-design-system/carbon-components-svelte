import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import PopoverClose from "./PopoverClose.test.svelte";

describe("Popover close event", () => {
  it('dispatches close with trigger "outside-click" and flips open', async () => {
    const onClose = vi.fn();
    render(PopoverClose, {
      props: { open: true, closeOnOutsideClick: true, onClose },
    });

    const popover = screen.getByTestId("parent").firstElementChild;
    expect(popover).toHaveClass("bx--popover--open");

    await user.click(document.body);

    expect(popover).not.toHaveClass("bx--popover--open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });

  it("does not dispatch close when closeOnOutsideClick is false", async () => {
    const onClose = vi.fn();
    render(PopoverClose, {
      props: { open: true, closeOnOutsideClick: false, onClose },
    });

    const popover = screen.getByTestId("parent").firstElementChild;

    await user.click(document.body);

    expect(popover).toHaveClass("bx--popover--open");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not dispatch close when the popover is already closed", async () => {
    const onClose = vi.fn();
    render(PopoverClose, {
      props: { open: false, closeOnOutsideClick: true, onClose },
    });

    await user.click(document.body);

    expect(onClose).not.toHaveBeenCalled();
  });
});
