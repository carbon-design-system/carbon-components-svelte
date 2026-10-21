import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Popover from "./Popover.test.svelte";

describe("Popover close event", () => {
  describe.each([
    {
      trigger: "outside-click",
      flag: "closeOnOutsideClick",
      act: () => user.click(document.body),
    },
    {
      trigger: "escape-key",
      flag: "closeOnEscape",
      act: () => user.keyboard("{Escape}"),
    },
  ])("$trigger", ({ trigger, flag, act }) => {
    it(`dispatches close with trigger "${trigger}" and flips open`, async () => {
      const onClose = vi.fn();
      render(Popover, { props: { open: true, [flag]: true, onClose } });

      const popover = screen.getByTestId("parent").firstElementChild;
      expect(popover).toHaveClass("bx--popover--open");

      await act();

      expect(popover).not.toHaveClass("bx--popover--open");
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose.mock.calls[0][0].detail).toEqual({ trigger });
    });

    it(`does not dispatch close when ${flag} is false`, async () => {
      const onClose = vi.fn();
      render(Popover, { props: { open: true, [flag]: false, onClose } });

      const popover = screen.getByTestId("parent").firstElementChild;

      await act();

      expect(popover).toHaveClass("bx--popover--open");
      expect(onClose).not.toHaveBeenCalled();
    });

    it("does not dispatch close when the popover is already closed", async () => {
      const onClose = vi.fn();
      render(Popover, { props: { open: false, [flag]: true, onClose } });

      await act();

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it("does not dispatch close on an Escape that cancels an IME composition", async () => {
    const onClose = vi.fn();
    render(Popover, {
      props: { open: true, closeOnEscape: true, onClose },
    });

    await fireEvent.keyDown(document.body, {
      key: "Escape",
      isComposing: true,
      keyCode: 229,
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
