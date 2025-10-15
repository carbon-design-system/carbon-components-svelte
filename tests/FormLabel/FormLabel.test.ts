import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import FormLabelTest from "./FormLabel.test.svelte";

describe("FormLabel", () => {
  it("should render with default props", () => {
    const { container } = render(FormLabelTest, {
      props: {
        slotContent: "Label text",
      },
    });

    const label = container.querySelector(".bx--label");
    expect(label).toBeInTheDocument();
    expect(screen.getByText("Label text")).toBeInTheDocument();
  });

  it("should render as label element", () => {
    const { container } = render(FormLabelTest, {
      props: {
        slotContent: "Label",
      },
    });

    const label = container.querySelector(".bx--label");
    expect(label?.tagName).toBe("LABEL");
  });

  it("should generate default id", () => {
    const { container } = render(FormLabelTest, {
      props: {
        slotContent: "Label",
      },
    });

    const label = container.querySelector(".bx--label");
    const forAttr = label?.getAttribute("for");
    expect(forAttr).toBeTruthy();
    expect(forAttr).toMatch(/^ccs-/);
  });

  it("should handle custom id", () => {
    const { container } = render(FormLabelTest, {
      props: {
        id: "custom-input-id",
        slotContent: "Label",
      },
    });

    const label = container.querySelector(".bx--label");
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
    const { container } = render(FormLabelTest, {
      props: {
        slotContent: "Clickable label",
      },
    });

    const label = container.querySelector(".bx--label");
    assert(label);
    await user.click(label);

    expect(consoleLog).toHaveBeenCalledWith("click");
  });

  it("should handle mouseover event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(FormLabelTest, {
      props: {
        slotContent: "Hoverable label",
      },
    });

    const label = container.querySelector(".bx--label");
    assert(label);
    await user.hover(label);

    expect(consoleLog).toHaveBeenCalledWith("mouseover");
  });

  it("should handle mouseenter event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(FormLabelTest, {
      props: {
        slotContent: "Label",
      },
    });

    const label = container.querySelector(".bx--label");
    assert(label);
    await user.hover(label);

    expect(consoleLog).toHaveBeenCalledWith("mouseenter");
  });

  it("should handle mouseleave event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(FormLabelTest, {
      props: {
        slotContent: "Label",
      },
    });

    const label = container.querySelector(".bx--label");
    assert(label);
    await user.hover(label);
    await user.unhover(label);

    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });

  it("should apply custom attributes", () => {
    const { container } = render(FormLabelTest, {
      props: {
        "data-testid": "custom-label",
        slotContent: "Label",
      },
    });

    const label = container.querySelector("[data-testid='custom-label']");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("bx--label");
  });

  it("should apply custom class via restProps", () => {
    const { container } = render(FormLabelTest, {
      props: {
        class: "custom-label-class",
        slotContent: "Label",
      },
    });

    const label = container.querySelector(".bx--label");
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

    const label = container.querySelector(".bx--label");
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
