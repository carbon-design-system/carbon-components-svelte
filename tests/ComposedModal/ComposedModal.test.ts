import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import ComposedModalTest from "./ComposedModal.test.svelte";

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
    const consoleLog = vi.spyOn(console, "log");
    const { component } = render(ComposedModalTest, {
      props: {
        open: false,
        headerTitle: "Test Modal",
      },
    });

    component.$set({ open: true });
    await tick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(consoleLog).toHaveBeenCalledWith("open");

    component.$set({ open: false });
    await tick();
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should handle size variants", () => {
    const sizes = ["xs", "sm", "lg"] as const;

    sizes.forEach((size) => {
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
    });
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

  it("should close on outside click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
      },
    });

    const modalWrapper = container.querySelector(".bx--modal");
    assert(modalWrapper);
    await user.click(modalWrapper);
    expect(consoleLog).toHaveBeenCalledWith("close");
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

  it("should handle close button click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
      },
    });

    const closeButton = screen.getByRole("button", { name: "Close" });
    await user.click(closeButton);
    expect(consoleLog).toHaveBeenCalledWith("close");
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

  it("should handle secondary button click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        footerSecondaryButtonText: "Cancel",
      },
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(consoleLog).toHaveBeenCalledWith("click:button--secondary", {
      text: "Cancel",
    });
    expect(consoleLog).toHaveBeenCalledWith("close");
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
    const { container } = render(ComposedModalTest, {
      props: {
        open: true,
        headerTitle: "Test Modal",
        bodyHasForm: true,
      },
    });

    const modalBody = container.querySelector(".bx--modal-content");
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

    const modalWrapper = document.querySelector("[data-testid='custom-modal']");
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
});
