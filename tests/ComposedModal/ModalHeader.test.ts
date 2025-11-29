import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ModalHeaderTest from "./ModalHeader.test.svelte";

describe("ModalHeader", () => {
  it("should render with default props", () => {
    render(ModalHeaderTest);

    const closeButton = screen.getByRole("button", { name: "Close" });
    const modalHeader = closeButton.closest(".bx--modal-header");
    expect(modalHeader).toBeInTheDocument();
  });

  it("should render title", () => {
    render(ModalHeaderTest, {
      props: {
        title: "Modal Title",
      },
    });

    const title = screen.getByText("Modal Title");
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass("bx--modal-header__heading");
    expect(title).toHaveClass("bx--type-beta");
  });

  it("should render label", () => {
    render(ModalHeaderTest, {
      props: {
        label: "Modal Label",
      },
    });

    const label = screen.getByText("Modal Label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("bx--modal-header__label");
    expect(label).toHaveClass("bx--type-delta");
  });

  it("should render both title and label", () => {
    render(ModalHeaderTest, {
      props: {
        title: "Modal Title",
        label: "Modal Label",
      },
    });

    expect(screen.getByText("Modal Title")).toBeInTheDocument();
    expect(screen.getByText("Modal Label")).toBeInTheDocument();
  });

  it("should render close button", () => {
    render(ModalHeaderTest);

    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveClass("bx--modal-close");
  });

  it("should handle custom icon description", () => {
    render(ModalHeaderTest, {
      props: {
        iconDescription: "Custom close text",
      },
    });

    const closeButton = screen.getByRole("button", {
      name: "Custom close text",
    });
    expect(closeButton).toBeInTheDocument();
  });

  it("should close modal on close button click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ModalHeaderTest);

    const closeButton = screen.getByRole("button", { name: "Close" });
    await user.click(closeButton);

    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should dispatch click event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ModalHeaderTest);

    const closeButton = screen.getByRole("button", { name: "Close" });
    await user.click(closeButton);

    expect(consoleLog).toHaveBeenCalledWith("click");
  });

  it("should apply custom label class", () => {
    render(ModalHeaderTest, {
      props: {
        label: "Test Label",
        labelClass: "custom-label-class",
      },
    });

    const label = screen.getByText("Test Label");
    expect(label).toHaveClass("custom-label-class");
  });

  it("should apply custom title class", () => {
    render(ModalHeaderTest, {
      props: {
        title: "Test Title",
        titleClass: "custom-title-class",
      },
    });

    const title = screen.getByText("Test Title");
    expect(title).toHaveClass("custom-title-class");
  });

  it("should apply custom close class", () => {
    render(ModalHeaderTest, {
      props: {
        closeClass: "custom-close-class",
      },
    });

    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toHaveClass("custom-close-class");
  });

  it("should apply custom close icon class", () => {
    render(ModalHeaderTest, {
      props: {
        closeIconClass: "custom-icon-class",
      },
    });

    const closeButton = screen.getByRole("button", { name: "Close" });
    const closeIcon = closeButton.querySelector(".bx--modal-close__icon");
    expect(closeIcon).toHaveClass("custom-icon-class");
  });

  it("should render slot content", () => {
    render(ModalHeaderTest, {
      props: {
        slotContent: "Custom header content",
      },
    });

    expect(screen.getByText("Custom header content")).toBeInTheDocument();
  });

  it("should apply custom attributes", () => {
    render(ModalHeaderTest, {
      props: {
        "data-testid": "custom-header",
      },
    });

    const modalHeader = screen.getByTestId("custom-header");
    expect(modalHeader).toBeInTheDocument();
  });

  it("should not render title when empty", () => {
    render(ModalHeaderTest, {
      props: {
        title: "",
      },
    });

    const closeButton = screen.getByRole("button", { name: "Close" });
    const modalHeader = closeButton.closest(".bx--modal-header");
    const title = modalHeader?.querySelector(".bx--modal-header__heading");
    expect(title).not.toBeInTheDocument();
  });

  it("should not render label when empty", () => {
    render(ModalHeaderTest, {
      props: {
        label: "",
      },
    });

    const closeButton = screen.getByRole("button", { name: "Close" });
    const modalHeader = closeButton.closest(".bx--modal-header");
    const label = modalHeader?.querySelector(".bx--modal-header__label");
    expect(label).not.toBeInTheDocument();
  });

  it("should render close icon with correct size", () => {
    render(ModalHeaderTest);

    const closeButton = screen.getByRole("button", { name: "Close" });
    const svg = closeButton.querySelector(".bx--modal-close__icon");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "20");
  });

  it("should have aria-hidden on close icon", () => {
    render(ModalHeaderTest);

    const closeButton = screen.getByRole("button", { name: "Close" });
    const svg = closeButton.querySelector(".bx--modal-close__icon");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
