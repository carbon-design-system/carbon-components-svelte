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

  it("should name the region with the modal heading", () => {
    render(ModalBodyTest, {
      props: {
        hasScrollingContent: true,
        slotContent: "Scrolling content",
      },
    });

    const modalBody = screen.getByRole("region");
    const labelledbyId = modalBody.getAttribute("aria-labelledby");
    assert(labelledbyId);
    expect(document.getElementById(labelledbyId)).toHaveTextContent(
      "Test Modal",
    );
  });

  it("should not set aria-labelledby when a consumer supplies aria-label", () => {
    render(ModalBodyTest, {
      props: {
        hasScrollingContent: true,
        slotContent: "Scrolling content",
        "aria-label": "Custom region name",
      },
    });

    const modalBody = screen.getByRole("region", {
      name: "Custom region name",
    });
    expect(modalBody).not.toHaveAttribute("aria-labelledby");
  });

  it("should not render the scrolling region when hasScrollingContent is false", () => {
    render(ModalBodyTest, {
      props: {
        hasScrollingContent: false,
        slotContent: "Content",
      },
    });

    const content = screen.getByText("Content");
    const modalBody = content.closest(".bx--modal-content");
    expect(modalBody).not.toHaveAttribute("aria-labelledby");
    expect(modalBody).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(
      modalBody?.parentElement?.querySelector(
        ".bx--modal-content--overflow-indicator",
      ),
    ).not.toBeInTheDocument();
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

  it("uses a consumer id and reports it to ComposedModal", () => {
    render(ModalBodyTest, {
      props: { id: "custom-body", alert: true, slotContent: "Content" },
    });

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-describedby", "custom-body");
    expect(dialog.querySelector(".bx--modal-content")).toHaveAttribute(
      "id",
      "custom-body",
    );
  });
});
