import { fireEvent, render, screen } from "@testing-library/svelte";
import type ModalComponent from "carbon-components-svelte/Modal/Modal.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { absorbUnhandledRejection } from "../utils/absorb-unhandled-rejection";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import { setViewportWidth } from "../utils/viewport";
import ModalTest from "./Modal.test.svelte";
import ModalEnterTargetTest from "./ModalEnterTarget.test.svelte";
import ModalFocusReturnTest from "./ModalFocusReturn.test.svelte";
import ModalFocusTrapTest from "./ModalFocusTrap.test.svelte";
import ModalFocusTrapLinkTest from "./ModalFocusTrapLink.test.svelte";
import ModalFormIdTest from "./ModalFormId.test.svelte";
import ModalNullishAriaLabel from "./ModalNullishAriaLabel.test.svelte";
import ModalSideNavBodyLockTest from "./ModalSideNavBodyLock.test.svelte";
import ModalTwoBodyLockTest from "./ModalTwoBodyLock.test.svelte";
import ModalUnmountOnCloseTest from "./ModalUnmountOnClose.test.svelte";
import {
  closeVia,
  finishClose,
  flushProgrammaticClose,
  getOverlay,
  reportClosingTransition,
} from "./helpers";

describe("Modal", () => {
  it("renders with default props", () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Test Modal",
        primaryButtonText: "Save",
        secondaryButtonText: "Cancel",
      },
    });

    const modalContainer = screen.getByRole("dialog");
    expect(modalContainer).toBeInTheDocument();

    expect(screen.getByText("Test Modal")).toBeInTheDocument();

    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Close the modal");
    expect(closeButton).toBeInTheDocument();

    expect(modalContainer).toHaveAttribute("role", "dialog");
    expect(modalContainer).toHaveAttribute("aria-modal", "true");
    expect(modalContainer).toHaveAttribute("aria-label", "Test Modal");
  });

  // Regression: ?? for aria-label chain so empty string is used (not fallback)
  it("uses empty aria-label when passed (nullish coalescing)", () => {
    render(ModalNullishAriaLabel, {
      props: {
        open: true,
        ariaLabel: "",
        primaryButtonText: "Save",
        secondaryButtonText: "Cancel",
      },
    });
    const modalContainer = screen.getByRole("dialog");
    expect(modalContainer).toHaveAttribute("aria-label", "");
  });

  it("opens and closes properly", async () => {
    const openHandler = vi.fn();
    const closeHandler = vi.fn();
    const { rerender } = render(ModalTest, {
      props: {
        open: false,
        modalHeading: "Test Modal",
        onopen: openHandler,
        onclose: closeHandler,
      },
    });

    await rerender({ open: true });
    await tick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(openHandler).toHaveBeenCalledTimes(1);

    await rerender({ open: false });
    await flushProgrammaticClose();
    expect(closeHandler).toHaveBeenCalledTimes(1);
  });

  // perf/modal-reactive-open-state: focusing on a post-mount open transition
  // now happens via `tick().then(focus)` (the `$:` block that dispatches
  // "open" runs before the DOM commits, unlike the old `afterUpdate`), so
  // this pins down that focus still lands correctly once the tick resolves,
  // and that an unrelated re-render doesn't cause a duplicate "open" dispatch.
  it("moves focus into the modal on a post-mount open transition, without duplicating on:open", async () => {
    const openHandler = vi.fn();
    const { rerender } = render(ModalTest, {
      props: {
        open: false,
        modalHeading: "Post-mount Focus Test",
        primaryButtonText: "Save",
        includeInput: false,
        onopen: openHandler,
      },
    });

    await rerender({ open: true });
    await tick();
    await tick();

    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
    expect(openHandler).toHaveBeenCalledTimes(1);

    // An unrelated re-render (open stays true) must not re-fire "open".
    await rerender({
      open: true,
      modalHeading: "Post-mount Focus Test Updated",
    });
    await tick();
    await tick();

    expect(openHandler).toHaveBeenCalledTimes(1);
  });

  it("handles button clicks", async () => {
    const onclickbuttonprimary = vi.fn();
    const onclickbuttonsecondary = vi.fn();
    render(ModalTest, {
      props: {
        open: true,
        primaryButtonText: "Save",
        secondaryButtonText: "Cancel",
        onclickbuttonprimary,
        onclickbuttonsecondary,
      },
    });

    await user.click(screen.getByText("Save"));
    expect(onclickbuttonprimary).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText("Cancel"));
    expect(onclickbuttonsecondary).toHaveBeenCalledTimes(1);
    expect(onclickbuttonsecondary.mock.calls[0][0].detail).toEqual({
      text: "Cancel",
    });
  });

  it("renders one secondaryButtons entry with legacy { text }", () => {
    render(ModalTest, {
      props: {
        open: true,
        primaryButtonText: "Save",
        secondaryButtons: [{ text: "Cancel" }],
      },
    });

    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(cancel).toHaveClass("bx--btn--secondary");
    expect(cancel).not.toBeDisabled();
  });

  it("renders two secondaryButtons with kind and disabled", () => {
    render(ModalTest, {
      props: {
        open: true,
        primaryButtonText: "Save",
        secondaryButtons: [
          { text: "Save draft", kind: "secondary" },
          { text: "Cancel", kind: "ghost", disabled: true },
        ],
      },
    });

    const draft = screen.getByRole("button", { name: "Save draft" });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(draft).toHaveClass("bx--btn--secondary");
    expect(cancel).toHaveClass("bx--btn--ghost");
    expect(cancel).toBeDisabled();

    const footer = draft.closest(".bx--modal-footer");
    expect(footer).toHaveClass("bx--modal-footer--three-button");
  });

  it("dispatches click:button--secondary for secondaryButtons entries", async () => {
    const onclickbuttonsecondary = vi.fn();
    render(ModalTest, {
      props: {
        open: true,
        primaryButtonText: "Save",
        secondaryButtons: [{ text: "Cancel" }, { text: "Reset" }],
        onclickbuttonsecondary,
      },
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onclickbuttonsecondary).toHaveBeenCalledTimes(1);
    expect(onclickbuttonsecondary.mock.calls[0][0].detail).toEqual({
      text: "Cancel",
    });

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(onclickbuttonsecondary).toHaveBeenCalledTimes(2);
    expect(onclickbuttonsecondary.mock.calls[1][0].detail).toEqual({
      text: "Reset",
    });
  });

  it.each([
    ["xs", "bx--modal-container--xs"],
    ["sm", "bx--modal-container--sm"],
    ["lg", "bx--modal-container--lg"],
    [undefined, undefined],
  ] as const)("renders size %s", (size, sizeClass) => {
    render(ModalTest, {
      props: { open: true, size, modalHeading: "Size Modal" },
    });

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveClass("bx--modal-container");
    for (const cls of [
      "bx--modal-container--xs",
      "bx--modal-container--sm",
      "bx--modal-container--lg",
    ]) {
      if (cls === sizeClass) expect(modal).toHaveClass(cls);
      else expect(modal).not.toHaveClass(cls);
    }
  });

  it("supports danger and alert variants", () => {
    render(ModalTest, {
      props: {
        open: true,
        danger: true,
        alert: true,
        modalHeading: "Danger Alert Modal",
        primaryButtonText: "Delete",
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Delete" });
    expect(primaryButton).toHaveClass("bx--btn--danger");

    const modal = screen.getByRole("alertdialog");
    expect(modal).toHaveAttribute("aria-label", "Danger Alert Modal");
  });

  describe("alert and labelling", () => {
    it("uses the alert role without a body description for a passive alert", () => {
      render(ModalTest, {
        props: {
          open: true,
          alert: true,
          passiveModal: true,
          modalHeading: "Heads up",
        },
      });

      expect(screen.getByRole("alert")).not.toHaveAttribute("aria-describedby");
    });

    it("describes an alertdialog by its body", () => {
      const { container } = render(ModalTest, {
        props: { open: true, alert: true, modalHeading: "Alert" },
      });

      const body = container.querySelector(".bx--modal-content");
      assert(body);
      expect(screen.getByRole("alertdialog")).toHaveAttribute(
        "aria-describedby",
        body.id,
      );
    });

    it("does not describe a plain dialog by its body", () => {
      render(ModalTest, { props: { open: true, modalHeading: "Plain" } });

      expect(screen.getByRole("dialog")).not.toHaveAttribute(
        "aria-describedby",
      );
    });

    it.each([
      ["the heading", { modalHeading: "Heading" }, "Heading"],
      [
        "the label over the heading",
        { modalLabel: "Label", modalHeading: "Heading" },
        "Label",
      ],
      [
        "modalAriaLabel over the heading",
        { modalAriaLabel: "Aria", modalHeading: "Heading" },
        "Aria",
      ],
      [
        "the label over modalAriaLabel",
        {
          modalLabel: "Label",
          modalAriaLabel: "Aria",
          modalHeading: "Heading",
        },
        "Label",
      ],
    ])("names the dialog from %s", (_name, props, expected) => {
      render(ModalTest, { props: { open: true, ...props } });

      expect(screen.getByRole("dialog")).toHaveAttribute(
        "aria-label",
        expected,
      );
    });

    it.each([
      ["the heading", { modalHeading: "Heading" }, "Heading"],
      [
        "the label when present",
        { modalLabel: "Label", modalHeading: "Heading" },
        "Label",
      ],
    ])("labels the body by %s", (_name, props, expected) => {
      const { container } = render(ModalTest, {
        props: { open: true, ...props },
      });

      const body = container.querySelector(".bx--modal-content");
      const labelledBy = body?.getAttribute("aria-labelledby");
      assert(labelledBy);
      expect(document.getElementById(labelledBy)).toHaveTextContent(expected);
    });
  });

  it("handles scrolling content", () => {
    render(ModalTest, {
      props: {
        open: true,
        hasScrollingContent: true,
        modalHeading: "Scrolling Modal",
      },
    });

    const modalBody = screen.getByRole("region");
    expect(modalBody).toHaveClass("bx--modal-scroll-content");
  });

  it("scrolls a newly-focused element out from under the scroll gradient", () => {
    render(ModalTest, {
      props: {
        open: true,
        hasScrollingContent: true,
        modalHeading: "Scrolling Modal",
      },
    });

    const modalContent = screen.getByRole("region");
    Object.defineProperty(modalContent, "clientHeight", { value: 100 });
    Object.defineProperty(modalContent, "scrollHeight", { value: 300 });
    modalContent.scrollTop = 50;
    modalContent.getBoundingClientRect = () => rect({ top: 0, bottom: 100 });

    const input = screen.getByTestId("test-focus");
    input.getBoundingClientRect = () => rect({ top: 110, bottom: 130 });

    input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    // scrollTop += itemBottom(130) - containerBottom(100) => 50 + 30 = 80
    expect(modalContent.scrollTop).toBe(80);
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2671
  it("should focus primary button when open (not close button)", () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Focus Test",
        primaryButtonText: "Save",
        secondaryButtonText: "Cancel",
        includeInput: false,
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Save" });
    expect(primaryButton).toHaveFocus();
  });

  it("should focus close button when open and passive", () => {
    render(ModalTest, {
      props: {
        open: true,
        passiveModal: true,
        modalHeading: "Passive Focus Test",
        includeInput: false,
      },
    });

    const closeButton = screen.getByLabelText("Close the modal");
    expect(closeButton).toHaveFocus();
  });

  it("leaves focus where a close handler moved it", async () => {
    render(ModalFocusReturnTest, {
      props: { moveFocusOnClose: true },
    });

    await user.click(screen.getByRole("button", { name: "Open Modal" }));
    await tick();
    await user.click(screen.getByLabelText("Close the modal"));
    await tick();
    await finishClose();

    expect(screen.getByRole("textbox", { name: "Elsewhere" })).toHaveFocus();
  });

  it("returns focus to the trigger without a closing transition", async () => {
    render(ModalFocusReturnTest);

    const trigger = screen.getByRole("button", { name: "Open Modal" });
    await user.click(trigger);
    await tick();
    await user.click(screen.getByLabelText("Close the modal"));
    await tick();
    await tick();

    expect(trigger).toHaveFocus();
  });

  it("focuses the dialog when it has nothing else to focus", async () => {
    render(ModalFocusReturnTest, {
      props: { passiveModal: true, hideCloseButton: true },
    });

    await user.click(screen.getByRole("button", { name: "Open Modal" }));
    await tick();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(dialog.parentElement).not.toHaveClass("is-visible");
  });

  // With a closing transition reported, `transitionend` is the only path that
  // restores focus.
  it.each(["close-button", "escape-key", "outside-click"] as const)(
    "returns focus to the trigger when closed via %s",
    async (via) => {
      const spy = reportClosingTransition();

      try {
        render(ModalFocusReturnTest, {
          props: { preventCloseOnClickOutside: false },
        });

        const trigger = screen.getByRole("button", { name: "Open Modal" });
        await user.click(trigger);
        await tick();

        expect(screen.getByRole("dialog")).toBeInTheDocument();

        await closeVia[via]();
        await finishClose();

        expect(trigger).toHaveFocus();
      } finally {
        spy.mockRestore();
      }
    },
  );

  it("restores focus only when the dialog's own transform transition ends", async () => {
    const spy = reportClosingTransition();

    try {
      render(ModalFocusReturnTest);

      const trigger = screen.getByRole("button", { name: "Open Modal" });
      await user.click(trigger);
      await tick();
      await closeVia["close-button"]();

      getOverlay().dispatchEvent(
        new TransitionEvent("transitionend", { propertyName: "opacity" }),
      );
      await tick();
      expect(trigger).not.toHaveFocus();

      await finishClose();
      expect(trigger).toHaveFocus();
    } finally {
      spy.mockRestore();
    }
  });

  it("skips initial focus when selectorPrimaryFocus is null", () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "No Focus",
        primaryButtonText: "Save",
        selectorPrimaryFocus: null,
      },
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(false);
    expect(screen.getByRole("button", { name: "Save" })).not.toHaveFocus();
    expect(screen.getByTestId("test-focus")).not.toHaveFocus();
  });

  it("skips focus on a post-mount open when selectorPrimaryFocus is null", async () => {
    const { rerender } = render(ModalTest, {
      props: {
        open: false,
        modalHeading: "No Focus",
        primaryButtonText: "Save",
        selectorPrimaryFocus: null,
      },
    });

    await rerender({ open: true });
    await tick();
    await tick();

    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(
      false,
    );
  });

  it("respects the selectorPrimaryFocus prop", () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Focus Test",
        primaryButtonText: "Save",
        includeSecondInput: true,
        selectorPrimaryFocus: "#test-focus-last",
      },
    });

    expect(screen.getByTestId("test-focus-last")).toHaveFocus();
  });

  it("focuses the first input when selectorPrimaryFocus is default and modal has form fields", () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Form Modal",
        primaryButtonText: "Save",
        secondaryButtonText: "Cancel",
      },
    });

    expect(screen.getByTestId("test-focus")).toHaveFocus();
  });

  it("selectorPrimaryFocus overrides first-input focus", () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Override Test",
        primaryButtonText: "Save",
        secondaryButtonText: "Cancel",
        selectorPrimaryFocus: "button.bx--btn--primary",
      },
    });

    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
  });

  it("focuses the cancel button when danger and modal has secondary button", () => {
    render(ModalTest, {
      props: {
        open: true,
        danger: true,
        modalHeading: "Delete Modal",
        primaryButtonText: "Delete",
        secondaryButtonText: "Cancel",
        includeInput: false,
      },
    });

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("selectorPrimaryFocus overrides danger focus", () => {
    render(ModalTest, {
      props: {
        open: true,
        danger: true,
        modalHeading: "Delete Modal",
        primaryButtonText: "Delete",
        secondaryButtonText: "Cancel",
        selectorPrimaryFocus: "button.bx--btn--danger",
        includeInput: false,
      },
    });

    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
  });

  // Carbon v11: a passive modal closes on an outside click by default, a
  // transactional one stays open, and an explicit boolean overrides both.
  it.each([
    {
      passiveModal: false,
      preventCloseOnClickOutside: undefined,
      closes: false,
    },
    { passiveModal: false, preventCloseOnClickOutside: true, closes: false },
    { passiveModal: false, preventCloseOnClickOutside: false, closes: true },
    { passiveModal: true, preventCloseOnClickOutside: undefined, closes: true },
    { passiveModal: true, preventCloseOnClickOutside: true, closes: false },
    { passiveModal: true, preventCloseOnClickOutside: false, closes: true },
  ])(
    "outside click with passiveModal=$passiveModal and preventCloseOnClickOutside=$preventCloseOnClickOutside closes: $closes",
    async ({ passiveModal, preventCloseOnClickOutside, closes }) => {
      const closeHandler = vi.fn();
      render(ModalTest, {
        props: {
          open: true,
          passiveModal,
          preventCloseOnClickOutside,
          modalHeading: "Outside click",
          primaryButtonText: "Save",
          secondaryButtonText: "Cancel",
          onclose: closeHandler,
        },
      });

      await closeVia["outside-click"]();

      expect(closeHandler).toHaveBeenCalledTimes(closes ? 1 : 0);
      expect(getOverlay().classList.contains("is-visible")).toBe(!closes);
    },
  );

  it("applies the outside-click rule when passiveModal changes after mount", async () => {
    const closeHandler = vi.fn();
    const { rerender } = render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Outside click",
        primaryButtonText: "Save",
        onclose: closeHandler,
      },
    });

    await rerender({ passiveModal: true });
    await closeVia["outside-click"]();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(getOverlay()).not.toHaveClass("is-visible");
  });

  it("supports passive modal variant", () => {
    render(ModalTest, {
      props: {
        open: true,
        passiveModal: true,
        modalHeading: "Passive Modal",
        primaryButtonText: "Save",
        secondaryButtonText: "Cancel",
      },
    });

    const closeButton = screen.getByLabelText("Close the modal");
    const heading = screen.getByText("Passive Modal");
    expect(heading.closest(".bx--modal-header")).toBeInTheDocument();
    expect(closeButton.closest(".bx--modal-header")).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close the modal" }),
    ).toBeInTheDocument();
  });

  it.each([
    "close-button",
    "escape-key",
    "outside-click",
    "programmatic",
  ] as const)("dispatches close event with %s trigger", async (trigger) => {
    const closeHandler = vi.fn();
    const { rerender } = render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Close Trigger Test",
        preventCloseOnClickOutside: false,
        onclose: closeHandler,
      },
    });

    await closeVia[trigger](rerender);

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({ trigger });
  });

  it("hides the close button when hideCloseButton is true", () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Forced choice",
        primaryButtonText: "Accept",
        secondaryButtonText: "Decline",
        hideCloseButton: true,
      },
    });

    expect(screen.queryByLabelText("Close the modal")).not.toBeInTheDocument();
    expect(screen.getByText("Accept")).toBeInTheDocument();
    expect(screen.getByText("Decline")).toBeInTheDocument();
  });

  it("still closes via footer secondary button when hideCloseButton is true", async () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Forced choice",
        primaryButtonText: "Accept",
        secondaryButtonText: "Decline",
        hideCloseButton: true,
        closeOnSecondary: true,
      },
    });

    expect(screen.queryByLabelText("Close the modal")).not.toBeInTheDocument();

    await user.click(screen.getByText("Decline"));
    await tick();

    expect(document.querySelector(".bx--modal")).not.toHaveClass("is-visible");
  });

  it("does not leave the modal open when a programmatic on:close handler throws", async () => {
    const error = new Error("consumer error");
    const trap = absorbUnhandledRejection((reason) => reason === error);

    const { rerender } = render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Throwing Close Test",
        onclose: () => {
          throw error;
        },
      },
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await rerender({ open: false });
    await flushProgrammaticClose();
    await trap.wait;
    trap.dispose();

    const modalWrapper = document.querySelector(".bx--modal");
    expect(modalWrapper).not.toHaveClass("is-visible");
    expect(modalWrapper).toHaveAttribute("inert");
  });

  // When the same boolean both gates an {#if} and binds `open`, flipping it
  // false closes *and* unmounts the modal in one flush. Svelte does not run a
  // component's `afterUpdate` while it is being torn down, so the programmatic
  // `close` is never delivered — in every supported Svelte version, and whether
  // the dispatch is synchronous or deferred via `tick()`. This documents that
  // deferring the dispatch did not regress teardown behavior (it is a
  // pre-existing Svelte limitation, not introduced by the defer).
  it("does not dispatch programmatic close when the same flip unmounts the modal", async () => {
    const closeHandler = vi.fn();
    const { rerender } = render(ModalUnmountOnCloseTest, {
      props: { open: true, onclose: closeHandler },
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await rerender({ open: false });
    await flushProgrammaticClose();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(closeHandler).not.toHaveBeenCalled();
  });

  it("prevents closing when preventDefault is called on close event", async () => {
    const closeHandler = vi.fn((e) => {
      e.preventDefault();
    });
    const { container } = render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Prevent Close Test",
        preventCloseOnClickOutside: false,
        onclose: closeHandler,
      },
    });

    const modalOverlay = container.querySelector(".bx--modal");
    assert(modalOverlay);

    await user.keyboard("{Escape}");
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(modalOverlay).toHaveClass("is-visible");
    expect(modalOverlay).not.toHaveAttribute("inert");

    await user.click(modalOverlay);
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(2);
    expect(modalOverlay).toHaveClass("is-visible");
    expect(modalOverlay).not.toHaveAttribute("inert");

    const closeButton = screen.getByLabelText("Close the modal");
    await user.click(closeButton);
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(3);
    expect(modalOverlay).toHaveClass("is-visible");
    expect(modalOverlay).not.toHaveAttribute("inert");
  });

  it("is inert when closed", async () => {
    const { container, rerender } = render(ModalTest, {
      props: {
        open: false,
        modalHeading: "Inert Test",
      },
    });

    const modalOverlay = container.querySelector(".bx--modal");
    assert(modalOverlay);
    expect(modalOverlay).toHaveAttribute("inert");

    await rerender({ open: true });
    await tick();

    expect(modalOverlay).not.toHaveAttribute("inert");
    await rerender({ open: false });
    await tick();

    expect(modalOverlay).toHaveAttribute("inert");
  });

  // Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/1392
  describe("focus trap with Dropdown and TextInput (issue #1392)", () => {
    // Tabbable buttons outside the modal make a missing trap observable: with
    // no trap, native Tab from the last element lands on the trailing button
    // and Shift+Tab from the first lands on the leading one, instead of wrapping.
    it.each([
      ["Select source", "Tab", "Login"],
      ["Login", "Tab", "Password"],
      ["Password", "Tab", "Cancel"],
      ["Cancel", "Tab", "OK"],
      ["Login", "Shift+Tab", "Select source"],
      ["OK", "Tab", "Close the modal"],
      ["Close the modal", "Shift+Tab", "OK"],
    ])("moves focus from %s on %s to %s", async (start, key, expected) => {
      const before = document.createElement("button");
      const after = document.createElement("button");
      document.body.prepend(before);
      document.body.append(after);

      try {
        render(ModalFocusTrapTest, { props: { open: true } });
        await tick();

        const find = (name: string) =>
          screen.queryByLabelText(name) ?? screen.getByRole("button", { name });
        find(start).focus();
        expect(find(start)).toHaveFocus();

        await user.keyboard(key === "Tab" ? "{Tab}" : "{Shift>}{Tab}{/Shift}");
        await tick();

        expect(find(expected)).toHaveFocus();
      } finally {
        before.remove();
        after.remove();
      }
    });
  });

  it.each([
    ["Service name", "Tab", "Region"],
    ["Region", "Shift+Tab", "Service name"],
  ])(
    "skips a link with tabindex -1: %s, %s, %s",
    async (start, key, expected) => {
      render(ModalFocusTrapLinkTest, { props: { open: true } });
      await tick();

      screen.getByLabelText(start).focus();
      await user.keyboard(key === "Tab" ? "{Tab}" : "{Shift>}{Tab}{/Shift}");
      await tick();

      expect(screen.getByLabelText(expected)).toHaveFocus();
    },
  );

  // Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/310
  describe("formId prop (issue #310)", () => {
    it("should submit the form when clicking the primary button with formId set", async () => {
      const formSubmitHandler = vi.fn();
      render(ModalFormIdTest, {
        props: {
          open: true,
          formId: "test-form",
          onFormSubmit: formSubmitHandler,
        },
      });

      const primaryButton = screen.getByRole("button", { name: "Submit" });
      await user.click(primaryButton);

      expect(formSubmitHandler).toHaveBeenCalledTimes(1);
    });

    it("should NOT submit the form when clicking the primary button without formId", async () => {
      const formSubmitHandler = vi.fn();
      render(ModalFormIdTest, {
        props: {
          open: true,
          formId: undefined,
          onFormSubmit: formSubmitHandler,
        },
      });

      const primaryButton = screen.getByRole("button", { name: "Submit" });
      await user.click(primaryButton);

      expect(formSubmitHandler).not.toHaveBeenCalled();
    });

    it("should submit the form when pressing Enter with formId and shouldSubmitOnEnter", async () => {
      const formSubmitHandler = vi.fn();
      render(ModalFormIdTest, {
        props: {
          open: true,
          formId: "test-form",
          shouldSubmitOnEnter: true,
          onFormSubmit: formSubmitHandler,
        },
      });

      const usernameInput = screen.getByTestId("username-input");
      usernameInput.focus();
      await user.keyboard("{Enter}");

      expect(formSubmitHandler).toHaveBeenCalledTimes(1);
    });

    it("should NOT submit the form when pressing Enter without formId", async () => {
      const formSubmitHandler = vi.fn();
      render(ModalFormIdTest, {
        props: {
          open: true,
          formId: undefined,
          shouldSubmitOnEnter: true,
          onFormSubmit: formSubmitHandler,
        },
      });

      const usernameInput = screen.getByTestId("username-input");
      usernameInput.focus();
      await user.keyboard("{Enter}");

      expect(formSubmitHandler).not.toHaveBeenCalled();
    });

    it("should set form attribute on primary button when formId is provided", () => {
      render(ModalFormIdTest, {
        props: {
          open: true,
          formId: "test-form",
        },
      });

      const primaryButton = screen.getByRole("button", { name: "Submit" });
      expect(primaryButton).toHaveAttribute("type", "submit");
      expect(primaryButton).toHaveAttribute("form", "test-form");
    });

    it("should still dispatch Modal submit and click:button--primary events with formId", async () => {
      const submitHandler = vi.fn();
      const clickPrimaryHandler = vi.fn();
      render(ModalTest, {
        props: {
          open: true,
          hasForm: true,
          modalHeading: "Form Modal",
          primaryButtonText: "Submit",
          onsubmit: submitHandler,
          onclickbuttonprimary: clickPrimaryHandler,
        },
      });

      const primaryButton = screen.getByRole("button", { name: "Submit" });
      await user.click(primaryButton);

      expect(submitHandler).toHaveBeenCalledTimes(1);
      expect(clickPrimaryHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Enter during IME composition", () => {
    function renderWithInput() {
      const submitHandler = vi.fn();
      const clickPrimaryHandler = vi.fn();
      render(ModalTest, {
        props: {
          open: true,
          modalHeading: "IME Modal",
          primaryButtonText: "Save",
          onsubmit: submitHandler,
          onclickbuttonprimary: clickPrimaryHandler,
        },
      });
      return {
        input: screen.getByTestId("test-focus"),
        submitHandler,
        clickPrimaryHandler,
      };
    }

    it("does not submit when isComposing is true", async () => {
      const { input, submitHandler, clickPrimaryHandler } = renderWithInput();
      await fireEvent.keyDown(input, { key: "Enter", isComposing: true });

      expect(submitHandler).not.toHaveBeenCalled();
      expect(clickPrimaryHandler).not.toHaveBeenCalled();
    });

    it("does not submit on Safari's keyCode 229 commit", async () => {
      const { input, submitHandler, clickPrimaryHandler } = renderWithInput();
      await fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });

      expect(submitHandler).not.toHaveBeenCalled();
      expect(clickPrimaryHandler).not.toHaveBeenCalled();
    });

    it("still submits on a plain Enter", async () => {
      const { input, submitHandler } = renderWithInput();
      await fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });

      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("does not close on an Escape that cancels IME composition", async () => {
    const onclose = vi.fn();
    render(ModalTest, {
      props: { open: true, modalHeading: "IME", onclose },
    });

    await fireEvent.keyDown(screen.getByTestId("test-focus"), {
      key: "Escape",
      isComposing: true,
    });

    expect(onclose).not.toHaveBeenCalled();
  });

  it("leaves focus alone when a child already handled Tab", async () => {
    render(ModalTest, {
      props: { open: true, modalHeading: "Editor", primaryButtonText: "Save" },
    });
    const input = screen.getByTestId("test-focus");
    input.addEventListener("keydown", (event) => event.preventDefault());
    input.focus();

    await user.keyboard("{Tab}");

    expect(input).toHaveFocus();
  });

  it.each([
    ["a textarea", "modal-textarea", 0],
    ["a link", "modal-link", 0],
    ["a select", "modal-select", 0],
    ["a text input next to a link", "modal-input", 1],
  ])(
    "pressing Enter in %s dispatches submit %i time(s)",
    async (_name, testId, calls) => {
      const submitHandler = vi.fn();
      const clickPrimaryHandler = vi.fn();
      render(ModalEnterTargetTest, {
        props: {
          open: true,
          shouldSubmitOnEnter: true,
          onsubmit: submitHandler,
          onclickbuttonprimary: clickPrimaryHandler,
        },
      });

      screen.getByTestId(testId).focus();
      await user.keyboard("{Enter}");
      await tick();

      expect(submitHandler).toHaveBeenCalledTimes(calls);
      expect(clickPrimaryHandler).toHaveBeenCalledTimes(calls);
    },
  );

  it("does not submit on Enter in a contenteditable element", async () => {
    const submitHandler = vi.fn();
    render(ModalEnterTargetTest, {
      props: { open: true, onsubmit: submitHandler },
    });

    const editable = screen.getByTestId("modal-editable");
    // The test DOM does not implement `isContentEditable`.
    Object.defineProperty(editable, "isContentEditable", { value: true });
    await fireEvent.keyDown(editable, { key: "Enter" });

    expect(submitHandler).not.toHaveBeenCalled();
  });

  it.each([
    ["primaryButtonDisabled is set", { primaryButtonDisabled: true }],
    ["shouldSubmitOnEnter is false", { shouldSubmitOnEnter: false }],
  ])("does not submit on Enter when %s", async (_name, props) => {
    const submitHandler = vi.fn();
    const clickPrimaryHandler = vi.fn();
    render(ModalEnterTargetTest, {
      props: {
        open: true,
        ...props,
        onsubmit: submitHandler,
        onclickbuttonprimary: clickPrimaryHandler,
      },
    });

    screen.getByTestId("modal-input").focus();
    await user.keyboard("{Enter}");
    await tick();

    expect(submitHandler).not.toHaveBeenCalled();
    expect(clickPrimaryHandler).not.toHaveBeenCalled();
  });

  describe("primaryButtonLoading", () => {
    it("shows InlineLoading and does not dispatch submit on click", async () => {
      const submitHandler = vi.fn();
      const clickPrimaryHandler = vi.fn();
      render(ModalTest, {
        props: {
          open: true,
          primaryButtonText: "Save",
          primaryButtonLoading: true,
          onsubmit: submitHandler,
          onclickbuttonprimary: clickPrimaryHandler,
        },
      });

      expect(screen.getByText("Loading")).toBeInTheDocument();
      expect(document.querySelector(".bx--inline-loading")).toBeInTheDocument();

      const primaryButton = screen.getByRole("button", { name: /Loading/i });
      expect(primaryButton).toBeDisabled();
      await user.click(primaryButton);

      expect(submitHandler).not.toHaveBeenCalled();
      expect(clickPrimaryHandler).not.toHaveBeenCalled();
    });

    it("does not dispatch submit when pressing Enter while loading", async () => {
      const submitHandler = vi.fn();
      const clickPrimaryHandler = vi.fn();
      render(ModalTest, {
        props: {
          open: true,
          primaryButtonText: "Save",
          primaryButtonLoading: true,
          shouldSubmitOnEnter: true,
          onsubmit: submitHandler,
          onclickbuttonprimary: clickPrimaryHandler,
        },
      });

      screen.getByTestId("test-focus").focus();
      await user.keyboard("{Enter}");
      await tick();

      expect(submitHandler).not.toHaveBeenCalled();
      expect(clickPrimaryHandler).not.toHaveBeenCalled();
    });

    it("uses a custom loading description", () => {
      render(ModalTest, {
        props: {
          open: true,
          primaryButtonText: "Save",
          primaryButtonLoading: true,
          primaryButtonLoadingDescription: "Saving...",
        },
      });

      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });
  });

  describe("secondaryButtonLoading", () => {
    it("shows InlineLoading and does not dispatch click on click", async () => {
      const clickSecondaryHandler = vi.fn();
      render(ModalTest, {
        props: {
          open: true,
          secondaryButtonText: "Cancel",
          secondaryButtonLoading: true,
          onclickbuttonsecondary: clickSecondaryHandler,
        },
      });

      expect(screen.getByText("Loading")).toBeInTheDocument();
      const secondaryButton = screen.getByRole("button", { name: /Loading/i });
      expect(secondaryButton).toBeDisabled();
      await user.click(secondaryButton);

      expect(clickSecondaryHandler).not.toHaveBeenCalled();
    });

    it("uses a custom loading description", () => {
      render(ModalTest, {
        props: {
          open: true,
          secondaryButtonText: "Cancel",
          secondaryButtonLoading: true,
          secondaryButtonLoadingDescription: "Cancelling...",
        },
      });

      expect(screen.getByText("Cancelling...")).toBeInTheDocument();
    });
  });

  describe("secondaryButtons loading", () => {
    it("shows InlineLoading for a loading entry and disables it", async () => {
      const clickSecondaryHandler = vi.fn();
      render(ModalTest, {
        props: {
          open: true,
          secondaryButtons: [
            { text: "Draft", loading: true, loadingDescription: "Saving..." },
            { text: "Discard" },
          ],
          onclickbuttonsecondary: clickSecondaryHandler,
        },
      });

      expect(screen.getByText("Saving...")).toBeInTheDocument();
      const loadingButton = screen.getByRole("button", { name: /Saving/i });
      expect(loadingButton).toBeDisabled();
      await user.click(loadingButton);
      expect(clickSecondaryHandler).not.toHaveBeenCalled();

      const idleButton = screen.getByRole("button", { name: "Discard" });
      expect(idleButton).not.toBeDisabled();
    });
  });

  describe("Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = ModalComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["primaryButtonIcon"]>().toEqualTypeOf<
        CustomIcon | undefined
      >();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = ModalComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["primaryButtonIcon"]>().toEqualTypeOf<any>();
    });
  });

  // Regression: Modal and SideNav must coordinate on the body scroll lock
  // class via a shared ref counter, so neither component clobbers the other.
  describe("body scroll lock coordination with SideNav", () => {
    afterEach(() => {
      setViewportWidth(1024);
      document.body.classList.remove("bx--body--with-modal-open");
    });

    it("keeps the body lock class when SideNav closes while a Modal is still open", async () => {
      setViewportWidth(500);

      const { component } = render(ModalSideNavBodyLockTest, {
        props: { modalOpen: false, sideNavOpen: false },
      });

      component.modalOpen = true;
      component.sideNavOpen = true;
      await tick();
      expect(document.body).toHaveClass("bx--body--with-modal-open");

      component.sideNavOpen = false;
      await tick();
      // Modal is still open — the class must remain.
      expect(document.body).toHaveClass("bx--body--with-modal-open");

      component.modalOpen = false;
      await tick();
      expect(document.body).not.toHaveClass("bx--body--with-modal-open");
    });

    it("keeps the body lock class when a Modal closes while SideNav is still open", async () => {
      setViewportWidth(500);

      const { component } = render(ModalSideNavBodyLockTest, {
        props: { modalOpen: false, sideNavOpen: false },
      });

      component.sideNavOpen = true;
      component.modalOpen = true;
      await tick();
      expect(document.body).toHaveClass("bx--body--with-modal-open");

      component.modalOpen = false;
      await tick();
      expect(document.body).toHaveClass("bx--body--with-modal-open");

      component.sideNavOpen = false;
      await tick();
      expect(document.body).not.toHaveClass("bx--body--with-modal-open");
    });
  });

  describe("body scroll lock from Modal alone", () => {
    it("keeps the body lock class until the last of two open modals closes", async () => {
      const { rerender } = render(ModalTwoBodyLockTest, {
        props: { firstOpen: true, secondOpen: true },
      });
      await tick();
      expect(document.body).toHaveClass("bx--body--with-modal-open");

      await rerender({ firstOpen: false });
      await tick();
      expect(document.body).toHaveClass("bx--body--with-modal-open");

      await rerender({ secondOpen: false });
      await tick();
      expect(document.body).not.toHaveClass("bx--body--with-modal-open");
    });

    it("releases the body lock class when an open modal unmounts", async () => {
      const { rerender } = render(ModalUnmountOnCloseTest, {
        props: { open: true },
      });
      await tick();
      expect(document.body).toHaveClass("bx--body--with-modal-open");

      await rerender({ open: false });
      await tick();
      expect(document.body).not.toHaveClass("bx--body--with-modal-open");
    });
  });
});
