import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import ComposedModalTest from "./ComposedModal.test.svelte";
import ComposedModalFocusTrapTest from "./ComposedModalFocusTrap.test.svelte";

describe("ComposedModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
  });

  it("should not have visible class when closed", () => {
    const { container } = render(ComposedModalTest, {
      props: {
        open: false,
        headerTitle: "Hidden Modal",
      },
    });

    const modalWrapper = container.querySelector(".bx--modal");
    expect(modalWrapper).not.toHaveClass("is-visible");
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

    rerender({ open: true });
    await tick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(openHandler).toHaveBeenCalledTimes(1);

    rerender({ open: false });
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(1);
  });

  it("should handle size variants", () => {
    const sizes = ["xs", "sm", "lg"] as const;

    for (const size of sizes) {
      const { unmount } = render(ComposedModalTest, {
        props: {
          open: true,
          size,
          headerTitle: `${size} Modal`,
        },
      });

      const modal = screen.getByRole("dialog");
      expect(modal).toHaveClass(`bx--modal-container--${size}`);
      unmount();
    }
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

  it("should not close on inside click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
      },
    });

    const modal = screen.getByRole("dialog");
    await user.click(modal);
    expect(consoleLog).not.toHaveBeenCalledWith("close");
  });

  it("should prevent close on outside click when configured", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(ComposedModalTest, {
      props: {
        open: true,
        preventCloseOnClickOutside: true,
        headerTitle: "Test Modal",
      },
    });

    const modalWrapper = container.querySelector(".bx--modal");
    assert(modalWrapper);
    await user.click(modalWrapper);
    expect(consoleLog).not.toHaveBeenCalledWith("close");
  });

  it("should render header with title and label", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Modal Title",
        headerLabel: "Modal Label",
      },
    });

    expect(screen.getByText("Modal Title")).toBeInTheDocument();
    expect(screen.getByText("Modal Label")).toBeInTheDocument();
  });

  it("should render footer with buttons", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        footerPrimaryButtonText: "Save",
        footerSecondaryButtonText: "Cancel",
      },
    });

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("should handle primary button click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        footerPrimaryButtonText: "Save",
      },
    });

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(consoleLog).toHaveBeenCalledWith("submit");
    expect(consoleLog).toHaveBeenCalledWith("click:button--primary");
  });

  it("should disable primary button when configured", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        footerPrimaryButtonText: "Save",
        footerPrimaryButtonDisabled: true,
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Save" });
    expect(primaryButton).toBeDisabled();
  });

  it("should handle scrolling content", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        bodyHasScrollingContent: true,
      },
    });

    const modalBody = screen.getByRole("region");
    expect(modalBody).toHaveClass("bx--modal-scroll-content");
    expect(modalBody).toHaveAttribute("tabindex", "0");
  });

  it("should handle form content", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        bodyHasForm: true,
      },
    });

    const modal = screen.getByRole("dialog");
    const modalBody = modal.querySelector(".bx--modal-content");
    expect(modalBody).toHaveClass("bx--modal-content--with-form");
  });

  it("should apply custom container class", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        containerClass: "custom-container",
      },
    });

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveClass("custom-container");
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

  it("should handle danger footer variant", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        footerPrimaryButtonText: "Delete",
        footerDanger: true,
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Delete" });
    expect(primaryButton).toHaveClass("bx--btn--danger");
  });

  it("should apply custom attributes", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        "data-testid": "custom-modal",
      },
    });

    const modalWrapper = screen.getByTestId("custom-modal");
    expect(modalWrapper).toBeInTheDocument();
  });

  it("should handle visible class when open", () => {
    const { container } = render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
      },
    });

    const modalWrapper = container.querySelector(".bx--modal");
    expect(modalWrapper).toHaveClass("is-visible");
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

    // Close via outside click.
    const modalOverlay = container.querySelector(".bx--modal");
    assert(modalOverlay);
    await user.click(modalOverlay);
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close via close button.
    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
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

    rerender({ open: true });
    await tick();

    expect(modalOverlay).not.toHaveAttribute("inert");
    rerender({ open: false });
    await tick();

    expect(modalOverlay).toHaveAttribute("inert");
  });

  // Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/1392
  describe("focus trap with Dropdown and TextInput (issue #1392)", () => {
    it("should tab from Dropdown to TextInput (forward navigation)", async () => {
      render(ComposedModalFocusTrapTest, {
        props: { open: true },
      });

      await tick();

      const dropdownButton = screen.getByLabelText("Select source");
      const loginInput = screen.getByLabelText("Login");

      dropdownButton.focus();
      expect(dropdownButton).toHaveFocus();

      await user.keyboard("{Tab}");
      await tick();

      expect(loginInput).toHaveFocus();
    });

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

      // Start from dropdown.
      dropdownButton.focus();
      expect(dropdownButton).toHaveFocus();

      // Tab to login input.
      await user.keyboard("{Tab}");
      await tick();
      expect(loginInput).toHaveFocus();

      // Tab to password input.
      await user.keyboard("{Tab}");
      await tick();
      expect(passwordInput).toHaveFocus();

      // Tab to Cancel button.
      await user.keyboard("{Tab}");
      await tick();
      expect(cancelButton).toHaveFocus();

      // Tab to OK button.
      await user.keyboard("{Tab}");
      await tick();
      expect(okButton).toHaveFocus();
    });
  });
});
