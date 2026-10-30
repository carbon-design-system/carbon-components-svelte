import { fireEvent, render, screen } from "@testing-library/svelte";
import type CoachmarkComponent from "carbon-components-svelte/Coachmark/Coachmark.svelte";
import { tick } from "svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { user } from "../utils/user";
import Coachmark from "./Coachmark.test.svelte";
import CoachmarkTarget from "./CoachmarkTarget.test.svelte";

const beacon = () => screen.getByRole("button", { name: "Show coachmark" });
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

describe("Coachmark", () => {
  it("names the dialog by its title and wires the trigger to it", async () => {
    render(Coachmark);

    expect(beacon()).toHaveAttribute("aria-haspopup", "dialog");
    expect(beacon()).toHaveAttribute("aria-expanded", "false");
    expect(beacon()).toHaveAttribute("aria-controls", "cm-content");
    expect(dialog()).toHaveAttribute("id", "cm-content");
    expect(dialog()).toHaveAttribute("aria-labelledby", "cm-title");
    expect(dialog()).not.toHaveAttribute("aria-modal");
    expect(document.getElementById("cm-title")).toHaveTextContent(
      "Export in bulk",
    );

    await user.click(beacon());

    expect(beacon()).toHaveAttribute("aria-expanded", "true");
    expect(dialog()).toHaveClass("bx--popover--open");
  });

  it("lets an aria-label on the coachmark win over the title", () => {
    render(Coachmark, { props: { "aria-label": "Bulk export tip" } });

    expect(dialog()).toHaveAttribute("aria-label", "Bulk export tip");
    expect(dialog()).not.toHaveAttribute("aria-labelledby");
  });

  it("opens from a custom target through the slot props", async () => {
    render(CoachmarkTarget);

    const target = screen.getByRole("button", { name: "Filter" });
    expect(target).toHaveAttribute("aria-controls", "cm-content");
    expect(screen.queryByRole("button", { name: "Show coachmark" })).toBeNull();

    await user.click(target);
    expect(target).toHaveAttribute("aria-expanded", "true");

    await user.click(target);
    expect(target).toHaveAttribute("aria-expanded", "false");
  });

  describe("focus", () => {
    it("moves focus into the dialog when the user opens it", async () => {
      render(Coachmark);

      await user.click(beacon());
      await tick();

      expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    });

    it("does not move focus when the open was not user-initiated", async () => {
      render(Coachmark);
      const field = screen.getByTestId("unrelated");
      field.focus();

      await user.click(screen.getByTestId("outside"));
      await tick();
      field.focus();
      await tick();

      expect(dialog()).toHaveClass("bx--popover--open");
      expect(field).toHaveFocus();
    });

    it("does not move focus for an open set before the user acts", async () => {
      render(Coachmark, { props: { open: true } });
      const field = screen.getByTestId("unrelated");
      field.focus();
      await tick();

      expect(field).toHaveFocus();
    });

    it("prefers selectorPrimaryFocus over the close button", async () => {
      render(Coachmark, { props: { withActions: true } });

      await user.click(beacon());
      await tick();

      expect(screen.getByRole("button", { name: "Try it" })).toHaveFocus();
    });
  });

  describe("close", () => {
    it("closes on Escape from inside, returns focus and reports it", async () => {
      const onClose = vi.fn();
      render(Coachmark, { props: { onClose } });

      await user.click(beacon());
      await tick();
      await user.keyboard("{Escape}");
      await tick();

      expect(onClose).toHaveBeenCalledWith({ trigger: "escape-key" });
      expect(beacon()).toHaveAttribute("aria-expanded", "false");
      expect(beacon()).toHaveFocus();
    });

    it("ignores Escape from an unrelated field", async () => {
      const onClose = vi.fn();
      render(Coachmark, { props: { open: true, onClose } });

      screen.getByTestId("unrelated").focus();
      await user.keyboard("{Escape}");
      await tick();

      expect(onClose).not.toHaveBeenCalled();
      expect(dialog()).toHaveClass("bx--popover--open");
    });

    it("ignores the Escape that cancels an IME composition", async () => {
      const onClose = vi.fn();
      render(Coachmark, { props: { open: true, onClose } });

      await fireEvent.keyDown(beacon(), { key: "Escape", isComposing: true });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("reports the close button and the target", async () => {
      const onClose = vi.fn();
      render(Coachmark, { props: { onClose } });

      await user.click(beacon());
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(onClose).toHaveBeenLastCalledWith({ trigger: "close-button" });
      expect(beacon()).toHaveFocus();

      await user.click(beacon());
      await user.click(beacon());
      expect(onClose).toHaveBeenLastCalledWith({ trigger: "target" });
    });

    it("closes from a slot's close and returns focus to the target", async () => {
      const onClose = vi.fn();
      render(Coachmark, { props: { withActions: true, onClose } });

      await user.click(beacon());
      await user.click(screen.getByRole("button", { name: "Try it" }));
      await tick();

      expect(onClose).toHaveBeenCalledWith({ trigger: "action" });
      expect(beacon()).toHaveFocus();
    });

    it("closes on an outside click unless closeOnOutsideClick is false", async () => {
      const onClose = vi.fn();
      const { unmount } = render(Coachmark, {
        props: { open: true, onClose },
      });
      await flushDismiss();

      await user.click(document.body);
      expect(onClose).toHaveBeenCalledWith({ trigger: "outside-click" });
      unmount();

      const stay = vi.fn();
      render(Coachmark, {
        props: { open: true, closeOnOutsideClick: false, onClose: stay },
      });
      await flushDismiss();

      await user.click(document.body);
      expect(stay).not.toHaveBeenCalled();
    });

    it("keeps a user close from happening when it is canceled", async () => {
      const onClose = vi.fn();
      render(Coachmark, {
        props: {
          onClose,
          onCloseEvent: (e: CustomEvent) => e.preventDefault(),
        },
      });

      await user.click(beacon());
      await user.click(screen.getByRole("button", { name: "Close" }));
      await user.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalledTimes(2);
      expect(dialog()).toHaveClass("bx--popover--open");
      expect(beacon()).toHaveAttribute("aria-expanded", "true");
    });

    it("reports what opened it, once per close", async () => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      const { rerender } = render(Coachmark, { props: { onOpen, onClose } });

      await user.click(beacon());
      expect(onOpen).toHaveBeenLastCalledWith({ trigger: "target" });
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(onClose).toHaveBeenCalledTimes(1);

      await rerender({ open: true });
      expect(onOpen).toHaveBeenLastCalledWith({ trigger: "programmatic" });
    });

    it("reports a programmatic close", async () => {
      const onClose = vi.fn();
      const { rerender } = render(Coachmark, {
        props: { open: true, onClose },
      });

      await rerender({ open: false });

      expect(onClose).toHaveBeenCalledWith({ trigger: "programmatic" });
    });
  });

  it("types the close trigger and the focus props", () => {
    type Close = ComponentEvents<CoachmarkComponent>["close"];
    expectTypeOf<Close["detail"]["trigger"]>().toEqualTypeOf<
      | "outside-click"
      | "escape-key"
      | "close-button"
      | "target"
      | "action"
      | "programmatic"
    >();

    type Props = ComponentProps<CoachmarkComponent>;
    expectTypeOf<Props["focusOnOpen"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<Props["selectorPrimaryFocus"]>().toEqualTypeOf<
      string | null | undefined
    >();
  });
});
