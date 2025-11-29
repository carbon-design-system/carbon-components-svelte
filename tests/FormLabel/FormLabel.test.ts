import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import FormLabelTest from "./FormLabel.test.svelte";

describe("FormLabel", () => {
  it("should render with default props", () => {
    render(FormLabelTest, {
      props: {
        slotContent: "Label text",
      },
    });

    const labelText = screen.getByText("Label text");
    const label = labelText.closest("label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("bx--label");
  });

  it("should render as label element", () => {
    render(FormLabelTest, {
      props: {
        slotContent: "Label",
      },
    });

    const labelText = screen.getByText("Label");
    const label = labelText.closest("label");
    assert(label);
    expect(label.tagName).toBe("LABEL");
  });

  it("should generate default id", () => {
    render(FormLabelTest, {
      props: {
        slotContent: "Label",
      },
    });

    const labelText = screen.getByText("Label");
    const label = labelText.closest("label");
    assert(label);
    const forAttr = label.getAttribute("for");
    expect(forAttr).toBeTruthy();
    expect(forAttr).toMatch(/^ccs-/);
  });

  it("should handle custom id", () => {
    render(FormLabelTest, {
      props: {
        id: "custom-input-id",
        slotContent: "Label",
      },
    });

    const labelText = screen.getByText("Label");
    const label = labelText.closest("label");
    assert(label);
    expect(label).toHaveAttribute("for", "custom-input-id");
  });

  it("should render slot content", () => {
    render(FormLabelTest, {
      props: {
        slotContent: "Custom label content",
      },
    });

    expect(screen.getByText("Custom label content")).toBeInTheDocument();
  });

  it("should handle click events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(FormLabelTest, {
      props: {
        slotContent: "Clickable label",
      },
    });

    const labelText = screen.getByText("Clickable label");
    const label = labelText.closest("label");
    assert(label);
    await user.click(label);

    expect(consoleLog).toHaveBeenCalledWith("click");
  });

  it("should handle mouseover event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(FormLabelTest, {
      props: {
        slotContent: "Hoverable label",
      },
    });

    const labelText = screen.getByText("Hoverable label");
    const label = labelText.closest("label");
    assert(label);
    await user.hover(label);

    expect(consoleLog).toHaveBeenCalledWith("mouseover");
  });

  it("should handle mouseenter event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(FormLabelTest, {
      props: {
        slotContent: "Label",
      },
    });

    const labelText = screen.getByText("Label");
    const label = labelText.closest("label");
    assert(label);
    await user.hover(label);

    expect(consoleLog).toHaveBeenCalledWith("mouseenter");
  });

  it("should handle mouseleave event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(FormLabelTest, {
      props: {
        slotContent: "Label",
      },
    });

    const labelText = screen.getByText("Label");
    const label = labelText.closest("label");
    assert(label);
    await user.hover(label);
    await user.unhover(label);

    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });

  it("should apply custom attributes", () => {
    render(FormLabelTest, {
      props: {
        "data-testid": "custom-label",
        slotContent: "Label",
      },
    });

    const label = screen.getByTestId("custom-label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("bx--label");
  });

  it("should apply custom class via restProps", () => {
    render(FormLabelTest, {
      props: {
        class: "custom-label-class",
        slotContent: "Label",
      },
    });

    const labelText = screen.getByText("Label");
    const label = labelText.closest("label");
    assert(label);
    expect(label).toHaveClass("custom-label-class");
  });

  it("should work with associated input", () => {
    const { container } = render(FormLabelTest, {
      props: {
        id: "test-input",
        slotContent: "Test Label",
      },
    });

    // Create an input with matching id
    const input = document.createElement("input");
    input.id = "test-input";
    container.appendChild(input);

    const labelText = screen.getByText("Test Label");
    const label = labelText.closest("label");
    assert(label);
    expect(label).toHaveAttribute("for", "test-input");
  });

  it("should expose id prop via accessors", () => {
    const { component } = render(FormLabelTest, {
      props: {
        id: "exposed-id",
        slotContent: "Label",
      },
    });

    expect(component.id).toBe("exposed-id");
  });
});
