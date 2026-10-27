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

    it("reports a programmatic close", async () => {
      const onClose = vi.fn();
      const { rerender } = render(Coachmark, {
        props: { open: true, onClose },
      });

      await rerender({ open: false });

      expect(onClose).toHaveBeenCalledWith({ trigger: "programmatic" });
    });
  });

  describe("steps", () => {
    const next = () => screen.getByRole("button", { name: "Next" });

    it("shows no footer for a single step", () => {
      render(Coachmark, { props: { open: true } });

      expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
    });

    it("moves through the steps, reports them and keeps focus on the heading", async () => {
      const onChange = vi.fn();
      render(Coachmark, { props: { open: true, stepCount: 3, onChange } });

      expect(screen.getByText("1 of 3")).toHaveAttribute("aria-live", "polite");
      expect(screen.queryByRole("button", { name: "Back" })).toBeNull();

      await user.click(next());
      await tick();

      expect(screen.getByText("2 of 3")).toBeInTheDocument();
      expect(screen.getByTestId("bound-step")).toHaveTextContent("1");
      expect(onChange).toHaveBeenLastCalledWith(1);
      expect(
        screen.getByRole("heading", { name: "Export in bulk" }),
      ).toHaveFocus();

      await user.click(screen.getByRole("button", { name: "Back" }));
      await tick();

      expect(screen.getByText("1 of 3")).toBeInTheDocument();
      expect(onChange).toHaveBeenLastCalledWith(0);
      expect(
        screen.getByRole("heading", { name: "Export in bulk" }),
      ).toHaveFocus();
    });

    it("ends on Done, which closes and returns focus", async () => {
      const onClose = vi.fn();
      render(Coachmark, { props: { stepCount: 2, onClose } });

      await user.click(beacon());
      await user.click(next());
      await user.click(screen.getByRole("button", { name: "Done" }));
      await tick();

      expect(onClose).toHaveBeenCalledWith({ trigger: "done" });
      expect(beacon()).toHaveFocus();
    });

    it("starts over when it opens again, without reporting a change", async () => {
      const onChange = vi.fn();
      render(Coachmark, { props: { stepCount: 2, onChange } });

      await user.click(beacon());
      await user.click(next());
      await user.click(screen.getByRole("button", { name: "Close" }));
      onChange.mockClear();
      await user.click(beacon());

      expect(screen.getByText("1 of 2")).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("takes a custom progress text", () => {
      render(Coachmark, {
        props: {
          open: true,
          stepCount: 4,
          stepText: (n: number, count: number) => `Step ${n}/${count}`,
        },
      });

      expect(screen.getByText("Step 1/4")).toBeInTheDocument();
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
      | "done"
      | "programmatic"
    >();

    type Props = ComponentProps<CoachmarkComponent>;
    expectTypeOf<Props["focusOnOpen"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<Props["selectorPrimaryFocus"]>().toEqualTypeOf<
      string | null | undefined
    >();
  });
});
