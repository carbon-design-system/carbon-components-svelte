import { render, screen } from "@testing-library/svelte";
import Stack from "./Stack.responsive.test.svelte";

describe("Stack responsive props", () => {
  it("emits a class per breakpoint for orientation objects, sm unprefixed", () => {
    render(Stack);

    const element = screen.getByText("orientation-object").parentElement;
    expect(element).toHaveClass("bx--stack-vertical");
    expect(element).toHaveClass("bx--stack-md-horizontal");
    expect(element).not.toHaveClass("bx--stack-horizontal");
  });

  it("keeps scalar orientation output unchanged", () => {
    render(Stack);

    const element = screen.getByText("orientation-scalar").parentElement;
    expect(element).toHaveClass("bx--stack-horizontal");
  });

  it("emits an explicit override for a default value at a non-sm breakpoint", () => {
    render(Stack);

    const element = screen.getByText("align-object").parentElement;
    expect(element).toHaveClass("bx--stack-align-start");
    expect(element).toHaveClass("bx--stack-align-lg-stretch");
  });

  it("keeps scalar align output unchanged for a non-default value", () => {
    render(Stack);

    const element = screen.getByText("align-scalar").parentElement;
    expect(element).toHaveClass("bx--stack-align-center");
  });

  it("emits no class for the scalar default align value", () => {
    render(Stack);

    const element = screen.getByText("align-scalar-default").parentElement;
    expect(element?.className).not.toMatch(/bx--stack-align-/);
  });

  it("emits an explicit override for the default wrap value at a non-sm breakpoint", () => {
    render(Stack);

    const element = screen.getByText("wrap-object").parentElement;
    expect(element).toHaveClass("bx--stack-wrap");
    expect(element).toHaveClass("bx--stack-md-nowrap");
  });

  it("emits no class for the scalar default wrap value", () => {
    render(Stack);

    const element = screen.getByText("wrap-scalar-default").parentElement;
    expect(element?.className).not.toMatch(/bx--stack-(wrap|nowrap)/);
  });

  it("emits one class per breakpoint for justify objects, sm unprefixed", () => {
    render(Stack);

    const element = screen.getByText("justify-object").parentElement;
    expect(element).toHaveClass("bx--stack-justify-start");
    expect(element).toHaveClass("bx--stack-justify-xlg-end");
  });
});
