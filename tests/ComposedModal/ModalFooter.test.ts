import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ModalFooterTest from "./ModalFooter.test.svelte";

describe("ModalFooter", () => {
  it("should render with default props", () => {
    const { container } = render(ModalFooterTest);

    const modalFooter = container.querySelector(".bx--modal-footer");
    expect(modalFooter).toBeInTheDocument();
  });

  it("should render primary button", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Save" });
    expect(primaryButton).toBeInTheDocument();
    expect(primaryButton).toHaveClass("bx--btn--primary");
  });

  it("should render secondary button", () => {
    render(ModalFooterTest, {
      props: {
        secondaryButtonText: "Cancel",
      },
    });

    const secondaryButton = screen.getByRole("button", { name: "Cancel" });
    expect(secondaryButton).toBeInTheDocument();
    expect(secondaryButton).toHaveClass("bx--btn--secondary");
  });

  it("should render both primary and secondary buttons", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
        secondaryButtonText: "Cancel",
      },
    });

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("should handle primary button click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
      },
    });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(consoleLog).toHaveBeenCalledWith("submit");
    expect(consoleLog).toHaveBeenCalledWith("click:button--primary");
  });

  it("should handle secondary button click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ModalFooterTest, {
      props: {
        secondaryButtonText: "Cancel",
      },
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(consoleLog).toHaveBeenCalledWith("click:button--secondary", {
      text: "Cancel",
    });
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should disable primary button when configured", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
        primaryButtonDisabled: true,
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Save" });
    expect(primaryButton).toBeDisabled();
  });

  it("should render danger variant", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Delete",
        danger: true,
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Delete" });
    expect(primaryButton).toHaveClass("bx--btn--danger");
  });

  it("should render two secondary buttons", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
        secondaryButtons: [{ text: "Cancel" }, { text: "Reset" }],
      },
    });

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("should handle three-button layout", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
        secondaryButtons: [{ text: "Cancel" }, { text: "Reset" }],
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Save" });
    const modalFooter = primaryButton.closest(".bx--modal-footer");
    expect(modalFooter).toHaveClass("bx--modal-footer--three-button");
  });

  it("should handle secondary button clicks with secondaryButtons array", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ModalFooterTest, {
      props: {
        secondaryButtons: [{ text: "Cancel" }, { text: "Reset" }],
      },
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(consoleLog).toHaveBeenCalledWith("click:button--secondary", {
      text: "Cancel",
    });

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(consoleLog).toHaveBeenCalledWith("click:button--secondary", {
      text: "Reset",
    });
  });

  it("should apply custom primary class", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
        primaryClass: "custom-primary-class",
      },
    });

    const primaryButton = screen.getByRole("button", { name: "Save" });
    expect(primaryButton).toHaveClass("custom-primary-class");
  });

  it("should apply custom secondary class", () => {
    render(ModalFooterTest, {
      props: {
        secondaryButtonText: "Cancel",
        secondaryClass: "custom-secondary-class",
      },
    });

    const secondaryButton = screen.getByRole("button", { name: "Cancel" });
    expect(secondaryButton).toHaveClass("custom-secondary-class");
  });

  it("should render slot content", () => {
    render(ModalFooterTest, {
      props: {
        slotContent: "Custom footer content",
      },
    });

    expect(screen.getByText("Custom footer content")).toBeInTheDocument();
  });

  it("should apply custom attributes", () => {
    render(ModalFooterTest, {
      props: {
        "data-testid": "custom-footer",
      },
    });

    const modalFooter = screen.getByTestId("custom-footer");
    expect(modalFooter).toBeInTheDocument();
  });

  it("should not render primary button when text is empty", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "",
        secondaryButtonText: "Cancel",
      },
    });

    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("should not render secondary button when text is empty", () => {
    render(ModalFooterTest, {
      props: {
        primaryButtonText: "Save",
        secondaryButtonText: "",
      },
    });

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
  });

  it("should prioritize secondaryButtons over secondaryButtonText", () => {
    render(ModalFooterTest, {
      props: {
        secondaryButtonText: "Cancel",
        secondaryButtons: [{ text: "Reset" }],
      },
    });

    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
  });

  it("should not close modal on secondary button click from array", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ModalFooterTest, {
      props: {
        secondaryButtons: [{ text: "Reset" }],
      },
    });

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(consoleLog).toHaveBeenCalledWith("click:button--secondary", {
      text: "Reset",
    });
    expect(consoleLog).not.toHaveBeenCalledWith("close");
  });
});
