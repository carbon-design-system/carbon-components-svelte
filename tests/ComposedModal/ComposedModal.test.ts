import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { absorbUnhandledRejection } from "../utils/absorb-unhandled-rejection";
import { user } from "../utils/user";
import ComposedModalTest from "./ComposedModal.test.svelte";
import ComposedModalFocusReturnTest from "./ComposedModalFocusReturn.test.svelte";
import ComposedModalFocusTrapTest from "./ComposedModalFocusTrap.test.svelte";
import ComposedModalUnmountOnCloseTest from "./ComposedModalUnmountOnClose.test.svelte";

async function flushProgrammaticClose() {
  await tick();
  await tick();
}

describe("ComposedModal", () => {
  it("should render with default props", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
      },
    });

    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveClass("bx--modal-container");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
  });

  it("keeps an empty rest aria-label off the presentation root", () => {
    render(ComposedModalTest, {
      props: { open: true, "aria-label": "", "data-testid": "modal-root" },
    });

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "");
    expect(screen.getByTestId("modal-root")).not.toHaveAttribute("aria-label");
  });

  it("names the dialog from the title without labelling the root", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Title only",
        "data-testid": "modal-root",
      },
    });

    expect(screen.getByRole("dialog")).toHaveAttribute(
      "aria-label",
      "Title only",
    );
    expect(screen.getByTestId("modal-root")).not.toHaveAttribute("aria-label");
    // The heading id reference is dropped once the header has registered.
    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-labelledby");
  });

  it("does not reference heading ids when there is no header", () => {
    render(ComposedModalTest, { props: { open: true } });

    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toHaveAttribute("aria-labelledby");
    expect(dialog).not.toHaveAttribute("aria-label");
  });

  it("clears the dialog name and region reference when the header unmounts", async () => {
    const { rerender } = render(ComposedModalTest, {
      props: {
        open: true,
        headerLabel: "Step 1",
        headerTitle: "Settings",
        bodyHasScrollingContent: true,
      },
    });

    await rerender({ headerLabel: "", headerTitle: "" });

    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-label");
    expect(screen.getByRole("region")).not.toHaveAttribute("aria-labelledby");
  });

  it("keeps a consumer aria-labelledby on the dialog, not the root", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Title only",
        "aria-labelledby": "custom-heading",
        "data-testid": "modal-root",
      },
    });

    expect(screen.getByRole("dialog")).toHaveAttribute(
      "aria-labelledby",
      "custom-heading",
    );
    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-label");
    expect(screen.getByTestId("modal-root")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("should handle open state", async () => {
    const openHandler = vi.fn();
    const closeHandler = vi.fn();
    const { rerender } = render(ComposedModalTest, {
      props: {
        open: false,
        headerTitle: "Test Modal",
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

  it("does not dispatch open or close when mounted closed", async () => {
    const openHandler = vi.fn();
    const closeHandler = vi.fn();
    render(ComposedModalTest, {
      props: {
        open: false,
        headerTitle: "Test Modal",
        onopen: openHandler,
        onclose: closeHandler,
      },
    });

    await tick();
    expect(openHandler).not.toHaveBeenCalled();
    expect(closeHandler).not.toHaveBeenCalled();
  });

  it.each(["xs", "sm", "lg"] as const)("should handle size %s", (size) => {
    render(ComposedModalTest, {
      props: {
        open: true,
        size,
        headerTitle: `${size} Modal`,
      },
    });

    expect(screen.getByRole("dialog")).toHaveClass(
      `bx--modal-container--${size}`,
    );
  });

  it("should handle danger variant", () => {
    const { container } = render(ComposedModalTest, {
      props: {
        open: true,
        danger: true,
        headerTitle: "Danger Modal",
      },
    });

    const modalWrapper = container.querySelector(".bx--modal");
    expect(modalWrapper).toHaveClass("bx--modal--danger");
  });

  it("should handle escape key to close", async () => {
    const { container } = render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
      },
    });

    const modalWrapper = container.querySelector(".bx--modal");
    expect(modalWrapper).toHaveClass("is-visible");

    const escapeEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    });
    modalWrapper?.dispatchEvent(escapeEvent);
    await tick();

    expect(modalWrapper).not.toHaveClass("is-visible");
  });

  it("does not close on an Escape that cancels IME composition", async () => {
    const onclose = vi.fn();
    render(ComposedModalTest, {
      props: { open: true, headerTitle: "IME", onclose },
    });

    await fireEvent.keyDown(screen.getByTestId("test-focus"), {
      key: "Escape",
      isComposing: true,
    });

    expect(onclose).not.toHaveBeenCalled();
  });

  it("should not close on inside click", async () => {
    const onclose = vi.fn();
    const { container } = render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        onclose,
      },
    });

    await user.click(screen.getByRole("dialog"));
    await tick();

    expect(onclose).not.toHaveBeenCalled();
    expect(container.querySelector(".bx--modal")).toHaveClass("is-visible");
  });

  // Carbon v11: without a ModalFooter the modal is passive and closes on an
  // outside click by default; with one it stays open. An explicit boolean
  // overrides both.
  it.each([
    { footer: true, preventCloseOnClickOutside: undefined, closes: false },
    { footer: true, preventCloseOnClickOutside: true, closes: false },
    { footer: true, preventCloseOnClickOutside: false, closes: true },
    { footer: false, preventCloseOnClickOutside: undefined, closes: true },
    { footer: false, preventCloseOnClickOutside: true, closes: false },
    { footer: false, preventCloseOnClickOutside: false, closes: true },
  ])(
    "outside click with footer=$footer and preventCloseOnClickOutside=$preventCloseOnClickOutside closes: $closes",
    async ({ footer, preventCloseOnClickOutside, closes }) => {
      const onclose = vi.fn();
      const { container } = render(ComposedModalTest, {
        props: {
          open: true,
          preventCloseOnClickOutside,
          headerTitle: "Test Modal",
          footerPrimaryButtonText: footer ? "Save" : "",
          onclose,
        },
      });

      const modalWrapper = container.querySelector(".bx--modal");
      assert(modalWrapper);
      await user.click(modalWrapper);
      await tick();

      expect(onclose).toHaveBeenCalledTimes(closes ? 1 : 0);
      expect(modalWrapper.classList.contains("is-visible")).toBe(!closes);
    },
  );

  it("becomes passive when its ModalFooter unmounts", async () => {
    const onclose = vi.fn();
    const { container, rerender } = render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        footerPrimaryButtonText: "Save",
        onclose,
      },
    });
    const modalWrapper = container.querySelector(".bx--modal");
    assert(modalWrapper);

    await user.click(modalWrapper);
    await tick();
    expect(onclose).not.toHaveBeenCalled();

    await rerender({ footerPrimaryButtonText: "" });
    await user.click(modalWrapper);
    await tick();

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(modalWrapper).not.toHaveClass("is-visible");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2671
  it("should focus primary button when open (not close button)", async () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Focus Test",
        footerPrimaryButtonText: "Save",
        footerSecondaryButtonText: "Cancel",
        includeInput: false,
      },
    });

    await tick();

    const primaryButton = screen.getByRole("button", { name: "Save" });
    expect(primaryButton).toHaveFocus();
  });

  it("moves focus into the modal on a post-mount open, without duplicating on:open", async () => {
    const openHandler = vi.fn();
    const { rerender } = render(ComposedModalTest, {
      props: {
        open: false,
        headerTitle: "Post-mount Focus Test",
        footerPrimaryButtonText: "Save",
        includeInput: false,
        onopen: openHandler,
      },
    });

    await rerender({ open: true });
    await tick();
    await tick();

    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
    expect(openHandler).toHaveBeenCalledTimes(1);

    await rerender({
      open: true,
      headerTitle: "Post-mount Focus Test Updated",
    });
    await tick();
    await tick();

    expect(openHandler).toHaveBeenCalledTimes(1);
  });

  it("restores focus only when the modal's own transform transition ends", async () => {
    // jsdom has no transitions, so report one on the dialog; otherwise focus
    // is restored right after close and `transitionend` is never needed.
    const getComputedStyle = window.getComputedStyle.bind(window);
    const spy = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((element, pseudo) =>
        element instanceof HTMLElement &&
        element.getAttribute("role") === "dialog"
          ? ({ transitionDuration: "0.24s" } as CSSStyleDeclaration)
          : getComputedStyle(element, pseudo),
      );

    try {
      const { container } = render(ComposedModalFocusReturnTest);
      const trigger = screen.getByRole("button", { name: "Open Modal" });
      await user.click(trigger);
      await tick();
      await tick();
      expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();

      await user.click(screen.getByLabelText("Close"));
      await flushProgrammaticClose();
      expect(trigger).not.toHaveFocus();

      const modalWrapper = container.querySelector(".bx--modal");
      assert(modalWrapper);
      modalWrapper.dispatchEvent(
        new TransitionEvent("transitionend", {
          propertyName: "background-color",
          bubbles: true,
        }),
      );
      await tick();
      expect(trigger).not.toHaveFocus();

      modalWrapper.dispatchEvent(
        new TransitionEvent("transitionend", { propertyName: "transform" }),
      );
      await tick();
      expect(trigger).toHaveFocus();
    } finally {
      spy.mockRestore();
    }
  });

  it("does not focus into a modal mounted closed", async () => {
    render(ComposedModalTest, {
      props: { open: false, headerTitle: "Closed" },
    });
    await tick();
    await tick();

    expect(screen.getByTestId("test-focus")).not.toHaveFocus();
  });

  it.each([
    ["the close button", () => user.click(screen.getByLabelText("Close"))],
    ["Escape", () => user.keyboard("{Escape}")],
    ["an outside click", (modalRoot: Element) => user.click(modalRoot)],
  ])(
    "returns focus to the trigger when closed via %s",
    async (_label, close) => {
      const { container } = render(ComposedModalFocusReturnTest, {
        props: { preventCloseOnClickOutside: false },
      });
      const modalRoot = container.querySelector(".bx--modal");
      assert(modalRoot);

      const trigger = screen.getByRole("button", { name: "Open Modal" });
      await user.click(trigger);
      await tick();
      await tick();

      expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();

      await close(modalRoot);
      await tick();

      modalRoot.dispatchEvent(
        new TransitionEvent("transitionend", { propertyName: "transform" }),
      );
      await tick();

      expect(trigger).toHaveFocus();
    },
  );

  it("focuses the dialog when it has nothing else to focus", async () => {
    render(ComposedModalFocusReturnTest, {
      props: { hideCloseButton: true, showFooter: false },
    });

    await user.click(screen.getByRole("button", { name: "Open Modal" }));
    await tick();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(dialog.parentElement).not.toHaveClass("is-visible");
  });

  it("should respect selectorPrimaryFocus", async () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        selectorPrimaryFocus: "#test-focus",
      },
    });

    await tick();
    expect(screen.getByTestId("test-focus")).toHaveFocus();
  });

  it("should focus the first input when selectorPrimaryFocus is default and modal has form fields", async () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Form Modal",
        footerPrimaryButtonText: "Save",
        footerSecondaryButtonText: "Cancel",
      },
    });

    await tick();
    expect(screen.getByTestId("test-focus")).toHaveFocus();
  });

  it("should allow selectorPrimaryFocus to override first-input focus", async () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Override Test",
        footerPrimaryButtonText: "Save",
        footerSecondaryButtonText: "Cancel",
        selectorPrimaryFocus: "button.bx--btn--primary",
      },
    });

    await tick();
    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
  });

  it("should focus the cancel button when danger and modal has secondary button", async () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        danger: true,
        headerTitle: "Delete Modal",
        footerPrimaryButtonText: "Delete",
        footerSecondaryButtonText: "Cancel",
        footerDanger: true,
        includeInput: false,
      },
    });

    await tick();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("should allow selectorPrimaryFocus to override danger focus", async () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        danger: true,
        headerTitle: "Delete Modal",
        footerPrimaryButtonText: "Delete",
        footerSecondaryButtonText: "Cancel",
        footerDanger: true,
        selectorPrimaryFocus: "button.bx--btn--danger",
        includeInput: false,
      },
    });

    await tick();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
  });

  describe("alert", () => {
    it("renders a dialog with no aria-describedby by default", () => {
      const { container } = render(ComposedModalTest, {
        props: { open: true, headerTitle: "Title" },
      });

      expect(screen.getByRole("dialog")).not.toHaveAttribute(
        "aria-describedby",
      );
      expect(container.querySelector(".bx--modal-content")?.id).toBeTruthy();
    });

    it("renders an alertdialog described by ModalBody", () => {
      const { container } = render(ComposedModalTest, {
        props: { open: true, headerTitle: "Title", alert: true },
      });

      const alertdialog = screen.getByRole("alertdialog");
      const body = container.querySelector(".bx--modal-content");
      assert(body);
      expect(body.id).toBeTruthy();
      expect(alertdialog).toHaveAttribute("aria-describedby", body.id);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("omits aria-describedby when there is no ModalBody", () => {
      render(ComposedModalTest, {
        props: {
          open: true,
          alert: true,
          headerTitle: "No body",
          includeBody: false,
        },
      });

      expect(screen.getByRole("alertdialog")).not.toHaveAttribute(
        "aria-describedby",
      );
    });
  });

  it("clears aria-describedby when the ModalBody unmounts", async () => {
    const { rerender } = render(ComposedModalTest, {
      props: { open: true, alert: true, headerTitle: "Title" },
    });
    expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-describedby");

    await rerender({ includeBody: false });

    expect(screen.getByRole("alertdialog")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  describe("body scroll lock", () => {
    const LOCK_CLASS = "bx--body--with-modal-open";

    it("locks body scroll while open", async () => {
      const { rerender } = render(ComposedModalTest, {
        props: { open: false, headerTitle: "Lock" },
      });
      expect(document.body).not.toHaveClass(LOCK_CLASS);

      await rerender({ open: true });
      await tick();
      expect(document.body).toHaveClass(LOCK_CLASS);

      await rerender({ open: false });
      await flushProgrammaticClose();
      expect(document.body).not.toHaveClass(LOCK_CLASS);
    });

    it("releases the lock when unmounted while open", () => {
      const { unmount } = render(ComposedModalTest, {
        props: { open: true, headerTitle: "Lock" },
      });
      expect(document.body).toHaveClass(LOCK_CLASS);

      unmount();

      expect(document.body).not.toHaveClass(LOCK_CLASS);
    });
  });

  describe("Escape", () => {
    it("dispatches close with the escape-key trigger", async () => {
      const onclose = vi.fn();
      render(ComposedModalTest, {
        props: { open: true, headerTitle: "Escape", onclose },
      });
      await tick();
      await tick();

      await user.keyboard("{Escape}");

      expect(onclose).toHaveBeenCalledTimes(1);
      expect(onclose.mock.calls[0][0].detail).toEqual({
        trigger: "escape-key",
      });
    });

    it("stays open when the close event is canceled", async () => {
      const onclose = vi.fn((e: CustomEvent) => e.preventDefault());
      const { container } = render(ComposedModalTest, {
        props: { open: true, headerTitle: "Escape", onclose },
      });
      await tick();
      await tick();

      await user.keyboard("{Escape}");

      expect(onclose).toHaveBeenCalledTimes(1);
      expect(container.querySelector(".bx--modal")).toHaveClass("is-visible");
    });
  });

  it.each([true, false])(
    "dispatches transitionend with open=%s when the root's transform transition ends",
    async (open) => {
      const ontransitionend = vi.fn();
      const { container } = render(ComposedModalTest, {
        props: { open, headerTitle: "Transition", ontransitionend },
      });
      const root = container.querySelector(".bx--modal");
      assert(root);

      root.dispatchEvent(
        new TransitionEvent("transitionend", { propertyName: "transform" }),
      );
      await tick();

      expect(ontransitionend).toHaveBeenCalledTimes(1);
      expect(ontransitionend.mock.calls[0][0].detail).toEqual({ open });
    },
  );

  it("applies the full-width class to the dialog", () => {
    render(ComposedModalTest, {
      props: { open: true, fullWidth: true, headerTitle: "Wide" },
    });

    expect(screen.getByRole("dialog")).toHaveClass(
      "bx--modal-container--full-width",
    );
  });

  it("should have correct ARIA attributes", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        headerLabel: "Test Label",
      },
    });

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAttribute("aria-label", "Test Label");
  });

  it("dispatches close event with outside-click trigger", async () => {
    const closeHandler = vi.fn();
    const { container } = render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Outside Click Test",
        onclose: closeHandler,
      },
    });

    const modalOverlay = container.querySelector(".bx--modal");
    assert(modalOverlay);
    await user.click(modalOverlay);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });

  it("dispatches close event with close-button trigger", async () => {
    const closeHandler = vi.fn();
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Close Button Test",
        onclose: closeHandler,
      },
    });

    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      trigger: "close-button",
    });
  });

  it("prevents closing when preventDefault is called on close event", async () => {
    const closeHandler = vi.fn((e) => {
      e.preventDefault();
    });
    const { container } = render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Prevent Close Test",
        onclose: closeHandler,
      },
    });

    const modalOverlay = container.querySelector(".bx--modal");
    assert(modalOverlay);
    await user.click(modalOverlay);
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dispatches close with programmatic trigger when closed via bind:open", async () => {
    const closeHandler = vi.fn();
    const { rerender } = render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Programmatic Close Test",
        onclose: closeHandler,
      },
    });

    await rerender({ open: false });
    await flushProgrammaticClose();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      trigger: "programmatic",
    });
  });

  it("dispatches close with programmatic trigger when closed via submit handler", async () => {
    const closeHandler = vi.fn();
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Submit Close Test",
        footerPrimaryButtonText: "Save",
        closeOnSubmit: true,
        onclose: closeHandler,
      },
    });

    await user.click(screen.getByRole("button", { name: "Save" }));
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      trigger: "programmatic",
    });
  });

  it("does not leave the modal open when a programmatic on:close handler throws", async () => {
    const error = new Error("consumer error");
    const trap = absorbUnhandledRejection((reason) => reason === error);

    const { rerender } = render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Throwing Close Test",
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
  // false closes *and* unmounts the modal in one flush. Svelte does not run the
  // component's reactive close block while it is being torn down, so the
  // programmatic `close` is never delivered — in every supported Svelte version,
  // and whether the dispatch is synchronous or deferred via `tick()`. This
  // documents that deferring the dispatch did not regress teardown behavior (it
  // is a pre-existing Svelte limitation, not introduced by the defer).
  it("does not dispatch programmatic close when the same flip unmounts the modal", async () => {
    const closeHandler = vi.fn();
    const { rerender } = render(ComposedModalUnmountOnCloseTest, {
      props: { open: true, onclose: closeHandler },
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await rerender({ open: false });
    await flushProgrammaticClose();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(closeHandler).not.toHaveBeenCalled();
  });

  it("is inert when closed", async () => {
    const { container, rerender } = render(ComposedModalTest, {
      props: {
        open: false,
        headerTitle: "Inert Test",
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
    it("should shift-tab from TextInput to Dropdown (reverse navigation)", async () => {
      render(ComposedModalFocusTrapTest, {
        props: { open: true },
      });

      await tick();

      const dropdownButton = screen.getByLabelText("Select source");
      const loginInput = screen.getByLabelText("Login");

      loginInput.focus();
      expect(loginInput).toHaveFocus();

      await user.keyboard("{Shift>}{Tab}{/Shift}");
      await tick();

      expect(dropdownButton).toHaveFocus();
    });

    it("should tab through all inputs in order", async () => {
      render(ComposedModalFocusTrapTest, {
        props: { open: true },
      });

      await tick();

      const dropdownButton = screen.getByLabelText("Select source");
      const loginInput = screen.getByLabelText("Login");
      const passwordInput = screen.getByLabelText("Password");
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      const okButton = screen.getByRole("button", { name: "OK" });

      dropdownButton.focus();
      expect(dropdownButton).toHaveFocus();

      await user.keyboard("{Tab}");
      await tick();
      expect(loginInput).toHaveFocus();

      await user.keyboard("{Tab}");
      await tick();
      expect(passwordInput).toHaveFocus();

      await user.keyboard("{Tab}");
      await tick();
      expect(cancelButton).toHaveFocus();

      await user.keyboard("{Tab}");
      await tick();
      expect(okButton).toHaveFocus();
    });
  });
});
