import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import ModalTest from "./Modal.test.svelte";
import ModalFocusReturnTest from "./ModalFocusReturn.test.svelte";
import ModalFocusTrapTest from "./ModalFocusTrap.test.svelte";
import ModalFormIdTest from "./ModalFormId.test.svelte";
import ModalNullishAriaLabel from "./ModalNullishAriaLabel.test.svelte";

describe("Modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Test Modal",
        primaryButtonText: "Save",
        secondaryButtonText: "Cancel",
      },
    });

    // Check if modal container is rendered
    const modalContainer = screen.getByRole("dialog");
    expect(modalContainer).toBeInTheDocument();

    // Check if modal heading is rendered
    expect(screen.getByText("Test Modal")).toBeInTheDocument();

    // Check if buttons are rendered
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();

    // Check if close button is rendered
    const closeButton = screen.getByLabelText("Close the modal");
    expect(closeButton).toBeInTheDocument();

    // Check if modal has correct ARIA attributes
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

  it("renders with basic structure", () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Test Modal",
        primaryButtonText: "Save",
        secondaryButtonText: "Cancel",
      },
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByLabelText("Close the modal")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
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

    // Open the modal
    rerender({ open: true });
    await tick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(openHandler).toHaveBeenCalledTimes(1);

    // Close the modal
    rerender({ open: false });
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(1);
  });

  it("handles form submission", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ModalTest, {
      props: {
        open: true,
        hasForm: true,
        modalHeading: "Form Modal",
        primaryButtonText: "Save",
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Save" });
    await user.click(primaryButton);
    expect(consoleLog).toHaveBeenCalledWith("submit");
    expect(consoleLog).toHaveBeenCalledWith("click:button--primary");
  });

  it("handles button clicks", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ModalTest, {
      props: {
        open: true,
        primaryButtonText: "Save",
        secondaryButtonText: "Cancel",
      },
    });

    await user.click(screen.getByText("Save"));
    expect(consoleLog).toHaveBeenCalledWith("click:button--primary");

    await user.click(screen.getByText("Cancel"));
    expect(consoleLog).toHaveBeenCalledWith("click:button--secondary", {
      text: "Cancel",
    });
  });

  it("supports different modal sizes", () => {
    type Size = "xs" | "sm" | "lg";
    const sizeMappings = {
      xs: "bx--modal-container--xs",
      sm: "bx--modal-container--sm",
      lg: "bx--modal-container--lg",
    } as const;

    // Test specific sizes
    for (const size of Object.keys(sizeMappings) as Size[]) {
      const { unmount } = render(ModalTest, {
        props: {
          open: true,
          size,
          modalHeading: `${size} Modal`,
        },
      });

      const modal = screen.getByRole("dialog");
      expect(modal).toHaveClass(sizeMappings[size]);
      unmount();
    }

    // Test default (medium) size
    const { unmount } = render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Medium Modal",
      },
    });

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveClass("bx--modal-container");
    expect(modal).not.toHaveClass("bx--modal-container--xs");
    expect(modal).not.toHaveClass("bx--modal-container--sm");
    expect(modal).not.toHaveClass("bx--modal-container--lg");
    unmount();
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

  it("returns focus to trigger when closed via close button", async () => {
    const { container } = render(ModalFocusReturnTest, {
      props: {},
    });

    const trigger = screen.getByRole("button", { name: "Open Modal" });
    await user.click(trigger);
    await tick();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Close the modal");
    await user.click(closeButton);
    await tick();

    const modalWrapper = container.querySelector(".bx--modal");
    assert(modalWrapper);
    modalWrapper.dispatchEvent(
      new TransitionEvent("transitionend", { propertyName: "transform" }),
    );
    await tick();

    expect(trigger).toHaveFocus();
  });

  it("returns focus to trigger when closed via Escape key", async () => {
    const { container } = render(ModalFocusReturnTest, {
      props: {},
    });

    const trigger = screen.getByRole("button", { name: "Open Modal" });
    await user.click(trigger);
    await tick();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await tick();

    const modalWrapper = container.querySelector(".bx--modal");
    assert(modalWrapper);
    modalWrapper.dispatchEvent(
      new TransitionEvent("transitionend", { propertyName: "transform" }),
    );
    await tick();

    expect(trigger).toHaveFocus();
  });

  it("returns focus to trigger when closed via outside click", async () => {
    const { container } = render(ModalFocusReturnTest, {
      props: {},
    });

    const trigger = screen.getByRole("button", { name: "Open Modal" });
    await user.click(trigger);
    await tick();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const modalWrapper = container.querySelector(".bx--modal");
    assert(modalWrapper);
    await user.click(modalWrapper);
    await tick();

    modalWrapper.dispatchEvent(
      new TransitionEvent("transitionend", { propertyName: "transform" }),
    );
    await tick();

    expect(trigger).toHaveFocus();
  });

  it("respects the selectorPrimaryFocus prop", () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Focus Test",
        selectorPrimaryFocus: "#test-focus",
      },
    });

    expect(screen.getByTestId("test-focus")).toHaveFocus();
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

  it("prevents closing when clicking outside if configured", async () => {
    render(ModalTest, {
      props: {
        open: true,
        preventCloseOnClickOutside: true,
        modalHeading: "Prevent Close Test",
      },
    });

    const closeHandler = vi.fn();
    render(ModalTest, {
      props: {
        open: true,
        preventCloseOnClickOutside: true,
        modalHeading: "Prevent Close Test",
        onclose: closeHandler,
      },
    });

    // Click outside the modal
    await user.click(document.body);
    expect(closeHandler).not.toHaveBeenCalled();
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

    // Verify close button is in header
    const closeButton = screen.getByLabelText("Close the modal");
    const heading = screen.getByText("Passive Modal");
    expect(heading.closest(".bx--modal-header")).toBeInTheDocument();
    expect(closeButton.closest(".bx--modal-header")).toBeInTheDocument();

    // Verify no footer is present
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

  it("dispatches close event with escape-key trigger", async () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Escape Key Test",
      },
    });

    const closeHandler = vi.fn();
    render(ModalTest, {
      props: {
        open: true,
        preventCloseOnClickOutside: true,
        modalHeading: "Prevent Close Test",
        onclose: closeHandler,
      },
    });

    await user.keyboard("{Escape}");
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      trigger: "escape-key",
    });
  });

  it("dispatches close event with outside-click trigger", async () => {
    const closeHandler = vi.fn();
    const { container } = render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Outside Click Test",
        onclose: closeHandler,
      },
    });

    // Click on the modal overlay
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
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Close Button Test",
        onclose: closeHandler,
      },
    });

    const closeButton = screen.getByLabelText("Close the modal");
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
    const { container } = render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Prevent Close Test",
        onclose: closeHandler,
      },
    });

    // Close via escape key.
    await user.keyboard("{Escape}");
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close via outside click.
    const modalOverlay = container.querySelector(".bx--modal");
    assert(modalOverlay);
    await user.click(modalOverlay);
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close via close button.
    const closeButton = screen.getByLabelText("Close the modal");
    await user.click(closeButton);
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(3);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
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
      render(ModalFocusTrapTest, {
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
      render(ModalFocusTrapTest, {
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
      render(ModalFocusTrapTest, {
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

      // Without formId, the form should not be submitted
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

      // Focus an input in the modal and press Enter
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

      // Focus an input in the modal and press Enter
      const usernameInput = screen.getByTestId("username-input");
      usernameInput.focus();
      await user.keyboard("{Enter}");

      // Without formId, the form should not be submitted
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

      // Both Modal events should occur
      expect(submitHandler).toHaveBeenCalledTimes(1);
      expect(clickPrimaryHandler).toHaveBeenCalledTimes(1);
    });
  });
});
