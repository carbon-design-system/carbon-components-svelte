import { render, screen } from "@testing-library/svelte";
import ModalBodyTest from "./ModalBody.test.svelte";

describe("ModalBody", () => {
  it("should render with default props", () => {
    render(ModalBodyTest, {
      props: {
        slotContent: "Modal content",
      },
    });

    const content = screen.getByText("Modal content");
    const modalBody = content.closest(".bx--modal-content");
    expect(modalBody).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("should handle hasForm prop", () => {
    render(ModalBodyTest, {
      props: {
        hasForm: true,
        slotContent: "Form content",
      },
    });

    const content = screen.getByText("Form content");
    const modalBody = content.closest(".bx--modal-content");
    expect(modalBody).toHaveClass("bx--modal-content--with-form");
  });

  it("should handle hasScrollingContent prop", () => {
    render(ModalBodyTest, {
      props: {
        hasScrollingContent: true,
        slotContent: "Scrolling content",
      },
    });

    const modalBody = screen.getByRole("region");
    expect(modalBody).toHaveClass("bx--modal-scroll-content");
    expect(modalBody).toHaveAttribute("tabindex", "0");
  });

  it("should render overflow indicator when hasScrollingContent is true", () => {
    render(ModalBodyTest, {
      props: {
        hasScrollingContent: true,
        slotContent: "Content",
      },
    });

    const modalBody = screen.getByRole("region");
    const indicator = modalBody.parentElement?.querySelector(
      ".bx--modal-content--overflow-indicator",
    );
    expect(indicator).toBeInTheDocument();
  });

  it("should not render overflow indicator when hasScrollingContent is false", () => {
    render(ModalBodyTest, {
      props: {
        hasScrollingContent: false,
        slotContent: "Content",
      },
    });

    const content = screen.getByText("Content");
    const modalBody = content.closest(".bx--modal-content");
    const indicator = modalBody?.parentElement?.querySelector(
      ".bx--modal-content--overflow-indicator",
    );
    expect(indicator).not.toBeInTheDocument();
  });

  it("should not have region role when hasScrollingContent is false", () => {
    render(ModalBodyTest, {
      props: {
        hasScrollingContent: false,
        slotContent: "Regular content",
      },
    });

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("should not have tabindex when hasScrollingContent is false", () => {
    render(ModalBodyTest, {
      props: {
        hasScrollingContent: false,
        slotContent: "Content",
      },
    });

    const content = screen.getByText("Content");
    const modalBody = content.closest(".bx--modal-content");
    expect(modalBody).not.toHaveAttribute("tabindex");
  });

  it("should render slot content", () => {
    render(ModalBodyTest, {
      props: {
        slotContent: "Custom slot content",
      },
    });

    expect(screen.getByText("Custom slot content")).toBeInTheDocument();
  });

  it("should apply custom attributes", () => {
    render(ModalBodyTest, {
      props: {
        "data-testid": "custom-body",
        slotContent: "Content",
      },
    });

    const modalBody = screen.getByTestId("custom-body");
    expect(modalBody).toBeInTheDocument();
  });

  it("should handle both hasForm and hasScrollingContent", () => {
    render(ModalBodyTest, {
      props: {
        hasForm: true,
        hasScrollingContent: true,
        slotContent: "Content",
      },
    });

    const modalBody = screen.getByRole("region");
    expect(modalBody).toHaveClass("bx--modal-content--with-form");
    expect(modalBody).toHaveClass("bx--modal-scroll-content");
  });
});
