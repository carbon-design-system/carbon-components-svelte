import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import FormGroupTest from "./FormGroup.test.svelte";

describe("FormGroup", () => {
  it("should render with default props", () => {
    const { container } = render(FormGroupTest, {
      props: {
        slotContent: "Form content",
      },
    });

    const fieldset = container.querySelector(".bx--fieldset");
    expect(fieldset).toBeInTheDocument();
    expect(screen.getByText("Form content")).toBeInTheDocument();
  });

  it("should render as fieldset element", () => {
    render(FormGroupTest, {
      props: {
        slotContent: "Content",
      },
    });

    const fieldset = screen.getByRole("group");
    expect(fieldset.tagName).toBe("FIELDSET");
  });

  it("should render legend text", () => {
    render(FormGroupTest, {
      props: {
        legendText: "Form Legend",
        slotContent: "Content",
      },
    });

    const legend = screen.getByText("Form Legend");
    expect(legend).toBeInTheDocument();
    expect(legend.tagName).toBe("LEGEND");
    expect(legend).toHaveClass("bx--label");
  });

  it("should not render legend when legendText is empty", () => {
    const { container } = render(FormGroupTest, {
      props: {
        legendText: "",
        slotContent: "Content",
      },
    });

    const legend = container.querySelector("legend");
    expect(legend).not.toBeInTheDocument();
  });

  it("should handle noMargin prop", () => {
    const { container } = render(FormGroupTest, {
      props: {
        noMargin: true,
        slotContent: "Content",
      },
    });

    const fieldset = container.querySelector(".bx--fieldset");
    expect(fieldset).toHaveClass("bx--fieldset--no-margin");
  });

  it("should handle invalid state", () => {
    render(FormGroupTest, {
      props: {
        invalid: true,
        slotContent: "Content",
      },
    });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveAttribute("data-invalid", "true");
  });

  it("should not have data-invalid when invalid is false", () => {
    render(FormGroupTest, {
      props: {
        invalid: false,
        slotContent: "Content",
      },
    });

    const fieldset = screen.getByRole("group");
    expect(fieldset).not.toHaveAttribute("data-invalid");
  });

  it("should render message when message prop is true", () => {
    render(FormGroupTest, {
      props: {
        message: true,
        messageText: "This is a message",
        slotContent: "Content",
      },
    });

    const message = screen.getByText("This is a message");
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass("bx--form__requirement");
  });

  it("should not render message when message prop is false", () => {
    render(FormGroupTest, {
      props: {
        message: false,
        messageText: "This is a message",
        slotContent: "Content",
      },
    });

    expect(screen.queryByText("This is a message")).not.toBeInTheDocument();
  });

  it("should handle legendId", () => {
    render(FormGroupTest, {
      props: {
        legendText: "Test Legend",
        legendId: "custom-legend-id",
        slotContent: "Content",
      },
    });

    const legend = screen.getByText("Test Legend");
    expect(legend).toHaveAttribute("id", "custom-legend-id");

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveAttribute("aria-labelledby", "custom-legend-id");
  });

  it("should handle aria-labelledby override", () => {
    render(FormGroupTest, {
      props: {
        legendText: "Test Legend",
        "aria-labelledby": "external-label",
        slotContent: "Content",
      },
    });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveAttribute("aria-labelledby", "external-label");
  });

  it("should handle click events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(FormGroupTest, {
      props: {
        slotContent: "Content",
      },
    });

    const fieldset = screen.getByRole("group");
    await user.click(fieldset);

    expect(consoleLog).toHaveBeenCalledWith("click");
  });

  it("should handle mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(FormGroupTest, {
      props: {
        slotContent: "Content",
      },
    });

    const fieldset = screen.getByRole("group");
    await user.hover(fieldset);

    expect(consoleLog).toHaveBeenCalledWith("mouseover");
    expect(consoleLog).toHaveBeenCalledWith("mouseenter");

    await user.unhover(fieldset);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });

  it("should render slot content", () => {
    render(FormGroupTest, {
      props: {
        slotContent: "Custom slot content",
      },
    });

    expect(screen.getByText("Custom slot content")).toBeInTheDocument();
  });

  it("should apply custom attributes", () => {
    const { container } = render(FormGroupTest, {
      props: {
        "data-testid": "custom-fieldset",
        slotContent: "Content",
      },
    });

    const fieldset = container.querySelector("[data-testid='custom-fieldset']");
    expect(fieldset).toBeInTheDocument();
  });

  it("should handle both invalid and message together", () => {
    render(FormGroupTest, {
      props: {
        invalid: true,
        message: true,
        messageText: "Error message",
        slotContent: "Content",
      },
    });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveAttribute("data-invalid", "true");
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("should handle legendId with aria-labelledby", () => {
    render(FormGroupTest, {
      props: {
        legendText: "Legend",
        legendId: "legend-1",
        "aria-labelledby": "legend-1",
        slotContent: "Content",
      },
    });

    const legend = screen.getByText("Legend");
    expect(legend).toHaveAttribute("id", "legend-1");

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveAttribute("aria-labelledby", "legend-1");
  });

  // Regression: ?? for aria-labelledby so empty string is used (not legendId)
  it("should use empty aria-labelledby when passed (nullish coalescing)", () => {
    render(FormGroupTest, {
      props: {
        legendText: "Legend",
        legendId: "my-legend-id",
        "aria-labelledby": "",
        slotContent: "Content",
      },
    });
    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveAttribute("aria-labelledby", "");
  });
});
