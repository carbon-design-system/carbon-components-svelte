import { render, screen } from "@testing-library/svelte";
import { rect } from "../utils/rect";
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

  it("names the region with the label heading when both label and title are set", () => {
    render(ModalBodyTest, {
      props: {
        hasScrollingContent: true,
        headerLabel: "Step 1",
        slotContent: "Scrolling content",
      },
    });

    const labelledbyId = screen
      .getByRole("region")
      .getAttribute("aria-labelledby");
    assert(labelledbyId);
    expect(document.getElementById(labelledbyId)).toHaveTextContent("Step 1");
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

  it("scrolls a newly-focused element out from under the scroll gradient", () => {
    render(ModalBodyTest, {
      props: { hasScrollingContent: true, includeInput: true },
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
});
