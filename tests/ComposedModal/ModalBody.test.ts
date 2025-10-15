import { render, screen } from "@testing-library/svelte";
import ModalBodyTest from "./ModalBody.test.svelte";

describe("ModalBody", () => {
  it("should render with default props", () => {
    const { container } = render(ModalBodyTest, {
      props: {
        slotContent: "Modal content",
      },
    });

    const modalBody = container.querySelector(".bx--modal-content");
    expect(modalBody).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("should handle hasForm prop", () => {
    const { container } = render(ModalBodyTest, {
      props: {
        hasForm: true,
        slotContent: "Form content",
      },
    });

    const modalBody = container.querySelector(".bx--modal-content");
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
    const { container } = render(ModalBodyTest, {
      props: {
        hasScrollingContent: true,
        slotContent: "Content",
      },
    });

    const indicator = container.querySelector(
      ".bx--modal-content--overflow-indicator",
    );
    expect(indicator).toBeInTheDocument();
  });

  it("should not render overflow indicator when hasScrollingContent is false", () => {
    const { container } = render(ModalBodyTest, {
      props: {
        hasScrollingContent: false,
        slotContent: "Content",
      },
    });

    const indicator = container.querySelector(
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
    const { container } = render(ModalBodyTest, {
      props: {
        hasScrollingContent: false,
        slotContent: "Content",
      },
    });

    const modalBody = container.querySelector(".bx--modal-content");
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
    const { container } = render(ModalBodyTest, {
      props: {
        "data-testid": "custom-body",
        slotContent: "Content",
      },
    });

    const modalBody = container.querySelector("[data-testid='custom-body']");
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
