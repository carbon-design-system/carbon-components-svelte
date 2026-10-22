import { render, screen } from "@testing-library/svelte";
import Stack from "./Stack.test.svelte";

describe("Stack", () => {
  it("should render with all gap scales", () => {
    render(Stack);

    for (let gap = 1; gap <= 13; gap++) {
      const element = screen.getByText(`gap-${gap}`);
      const stackElement = element.parentElement;
      expect(stackElement).toHaveClass("bx--stack");
      expect(stackElement).toHaveClass(`bx--stack-scale-${gap}`);
    }
  });

  it("should apply vertical orientation class by default", () => {
    render(Stack);

    const element = screen.getByText("gap-1");
    const stackElement = element.parentElement;
    expect(stackElement).toHaveClass("bx--stack-vertical");
  });

  it("should apply horizontal orientation class", () => {
    render(Stack);

    const horizontalElements = [
      "horizontal-gap-1",
      "horizontal-gap-5",
      "horizontal-gap-13",
    ];

    for (const text of horizontalElements) {
      const element = screen.getByText(text);
      const stackElement = element.parentElement;
      expect(stackElement).toHaveClass("bx--stack");
      expect(stackElement).toHaveClass("bx--stack-horizontal");
    }
  });

  it("should apply inline gap style for custom string values", () => {
    render(Stack);

    const element200px = screen.getByText("custom-gap-200px");
    const stackElement200px = element200px.parentElement;
    expect(stackElement200px).toHaveClass("bx--stack");
    expect(stackElement200px).toHaveStyle({ gap: "200px" });

    const element15rem = screen.getByText("custom-gap-1.5rem");
    const stackElement15rem = element15rem.parentElement;
    expect(stackElement15rem).toHaveClass("bx--stack");
    expect(stackElement15rem).toHaveStyle({ gap: "1.5rem" });
  });

  it("should render with custom tag elements", () => {
    render(Stack);

    const ulElement = screen.getByText("custom-tag-ul");
    expect(ulElement.parentElement?.tagName).toBe("UL");
    expect(ulElement.parentElement).toHaveClass("bx--stack");

    const sectionElement = screen.getByText("custom-tag-section");
    expect(sectionElement.parentElement?.tagName).toBe("SECTION");
    expect(sectionElement.parentElement).toHaveClass("bx--stack");
  });

  it("should not apply scale classes for custom string gap values", () => {
    render(Stack);

    const element = screen.getByText("custom-gap-200px");
    const stackElement = element.parentElement;

    expect(stackElement).toHaveClass("bx--stack");
    expect(stackElement?.className).not.toMatch(/bx--stack-scale-/);
  });

  it("should apply inline class when inline is true", () => {
    render(Stack);

    const element = screen.getByText("inline-default");
    const stackElement = element.parentElement;
    expect(stackElement).toHaveClass("bx--stack");
    expect(stackElement).toHaveClass("bx--stack-inline");
    expect(stackElement).toHaveClass("bx--stack-vertical");
  });

  it("should not apply inline class by default", () => {
    render(Stack);

    const element = screen.getByText("gap-1");
    const stackElement = element.parentElement;
    expect(stackElement).not.toHaveClass("bx--stack-inline");
  });

  it("should apply wrap class when wrap is 'wrap'", () => {
    render(Stack);

    const element = screen.getByText("wrap-wrap");
    const stackElement = element.parentElement;
    expect(stackElement).toHaveClass("bx--stack-horizontal");
    expect(stackElement).toHaveClass("bx--stack-wrap");
    expect(stackElement).not.toHaveClass("bx--stack-wrap-reverse");
  });

  it("should apply wrap-reverse class when wrap is 'wrap-reverse'", () => {
    render(Stack);

    const element = screen.getByText("wrap-reverse");
    const stackElement = element.parentElement;
    expect(stackElement).toHaveClass("bx--stack-wrap-reverse");
    expect(stackElement).not.toHaveClass("bx--stack-wrap");
  });

  it("applies the wrap class to a vertical stack", () => {
    render(Stack);

    const stackElement = screen.getByText("vertical-wrap").parentElement;
    expect(stackElement).toHaveClass("bx--stack-vertical");
    expect(stackElement).toHaveClass("bx--stack-wrap");
  });

  it("should not apply any wrap class by default", () => {
    render(Stack);

    const element = screen.getByText("gap-1");
    const stackElement = element.parentElement;
    expect(stackElement).not.toHaveClass("bx--stack-wrap");
    expect(stackElement).not.toHaveClass("bx--stack-wrap-reverse");
  });

  it("should omit gap class when gap is 0", () => {
    render(Stack);

    const verticalElement = screen.getByText("gap-0");
    const verticalStackElement = verticalElement.parentElement;
    expect(verticalStackElement).toHaveClass("bx--stack");
    expect(verticalStackElement).toHaveClass("bx--stack-vertical");

    for (let gap = 0; gap <= 13; gap++) {
      expect(verticalStackElement).not.toHaveClass(`bx--stack-scale-${gap}`);
    }
  });
});
