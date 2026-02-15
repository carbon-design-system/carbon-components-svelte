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

  it("should apply correct gap scale classes for horizontal stacks", () => {
    render(Stack);

    const element1 = screen.getByText("horizontal-gap-1");
    expect(element1.parentElement).toHaveClass("bx--stack-scale-1");

    const element5 = screen.getByText("horizontal-gap-5");
    expect(element5.parentElement).toHaveClass("bx--stack-scale-5");

    const element13 = screen.getByText("horizontal-gap-13");
    expect(element13.parentElement).toHaveClass("bx--stack-scale-13");
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

  it("should combine tag, gap, and orientation props", () => {
    render(Stack);

    const element = screen.getByText("combined-props");
    const stackElement = element.parentElement;

    expect(stackElement?.tagName).toBe("OL");
    expect(stackElement).toHaveClass("bx--stack");
    expect(stackElement).toHaveClass("bx--stack-horizontal");
    expect(stackElement).toHaveClass("bx--stack-scale-13");
  });

  it("should not apply scale classes for custom string gap values", () => {
    render(Stack);

    const element = screen.getByText("custom-gap-200px");
    const stackElement = element.parentElement;

    expect(stackElement).toHaveClass("bx--stack");

    for (let gap = 1; gap <= 13; gap++) {
      expect(stackElement).not.toHaveClass(`bx--stack-scale-${gap}`);
    }
  });

  it("should apply inline class when inline is true", () => {
    render(Stack);

    const element = screen.getByText("inline-default");
    const stackElement = element.parentElement;
    expect(stackElement).toHaveClass("bx--stack");
    expect(stackElement).toHaveClass("bx--stack-inline");
    expect(stackElement).toHaveClass("bx--stack-vertical");
  });

  it("should apply inline class with horizontal orientation", () => {
    render(Stack);

    const element = screen.getByText("inline-horizontal");
    const stackElement = element.parentElement;
    expect(stackElement).toHaveClass("bx--stack");
    expect(stackElement).toHaveClass("bx--stack-inline");
    expect(stackElement).toHaveClass("bx--stack-horizontal");
    expect(stackElement).toHaveClass("bx--stack-scale-3");
  });

  it("should not apply inline class by default", () => {
    render(Stack);

    const element = screen.getByText("gap-1");
    const stackElement = element.parentElement;
    expect(stackElement).not.toHaveClass("bx--stack-inline");
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

    const horizontalElement = screen.getByText("horizontal-gap-0");
    const horizontalStackElement = horizontalElement.parentElement;
    expect(horizontalStackElement).toHaveClass("bx--stack");
    expect(horizontalStackElement).toHaveClass("bx--stack-horizontal");

    for (let gap = 0; gap <= 13; gap++) {
      expect(horizontalStackElement).not.toHaveClass(`bx--stack-scale-${gap}`);
    }
  });
});
