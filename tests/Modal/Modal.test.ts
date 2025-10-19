import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user, isSvelte4, isSvelte5 } from "../setup-tests";
import ModalTestSvelte4 from "./Modal.test.svelte";
import ModalTestSvelte5 from "./Modal.svelte5.test.svelte";

const ModalTest = isSvelte5 ? ModalTestSvelte5 : ModalTestSvelte4;

describe("Modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", async () => {
    const { container } = render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Test Modal",
        primaryButtonText: "Save",
        secondaryButtonText: "Cancel",
      },
    });

    // Check if modal container is rendered
    const modalContainer = container.querySelector(".bx--modal-container");
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
    const { component } = render(ModalTest, {
      props: {
        open: false,
        modalHeading: "Test Modal",
      },
    });

    const openHandler = vi.fn();
    const closeHandler = vi.fn();
    component.$on("open", openHandler);
    component.$on("close", closeHandler);

    // Open the modal
    component.$set({ open: true });
    await tick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(openHandler).toHaveBeenCalledTimes(1);

    // Close the modal
    component.$set({ open: false });
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
    (Object.keys(sizeMappings) as Size[]).forEach((size) => {
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
    });

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

  it("should focus close button when open", async () => {
    render(ModalTest, {
      props: {
        open: true,
      },
    });

    const closeButton = screen.getByLabelText("Close the modal");
    expect(closeButton).toHaveFocus();
  });

  it("respects the selectorPrimaryFocus prop", async () => {
    render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Focus Test",
        selectorPrimaryFocus: "#test-focus",
      },
    });

    expect(screen.getByTestId("test-focus")).toHaveFocus();
  });

  it("prevents closing when clicking outside if configured", async () => {
    const { component } = render(ModalTest, {
      props: {
        open: true,
        preventCloseOnClickOutside: true,
        modalHeading: "Prevent Close Test",
      },
    });

    const closeHandler = vi.fn();
    component.$on("close", closeHandler);

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
    const { component } = render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Escape Key Test",
      },
    });

    const closeHandler = vi.fn();
    component.$on("close", closeHandler);

    await user.keyboard("{Escape}");
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      trigger: "escape-key",
    });
  });

  it("dispatches close event with outside-click trigger", async () => {
    const { container, component } = render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Outside Click Test",
      },
    });

    const closeHandler = vi.fn();
    component.$on("close", closeHandler);

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
    const { component } = render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Close Button Test",
      },
    });

    const closeHandler = vi.fn();
    component.$on("close", closeHandler);

    const closeButton = screen.getByLabelText("Close the modal");
    await user.click(closeButton);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      trigger: "close-button",
    });
  });

  it("prevents closing when preventDefault is called on close event", async () => {
    const { container, component } = render(ModalTest, {
      props: {
        open: true,
        modalHeading: "Prevent Close Test",
      },
    });

    const closeHandler = vi.fn((e) => {
      e.preventDefault();
    });
    component.$on("close", closeHandler);

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
});
