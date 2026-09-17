import { render, screen } from "@testing-library/svelte";
import ButtonSet from "./ButtonSet.responsive.test.svelte";

describe("ButtonSet responsive stacked", () => {
  it("emits no stacked class by default", () => {
    render(ButtonSet);

    const element = screen.getByText("scalar-default").parentElement;
    expect(element).toHaveClass("bx--btn-set");
    expect(element).not.toHaveClass("bx--btn-set--stacked");
  });

  it("keeps scalar stacked output unchanged", () => {
    render(ButtonSet);

    const element = screen.getByText("scalar-stacked").parentElement;
    expect(element).toHaveClass("bx--btn-set--stacked");
  });

  it("emits an un-prefixed override for false at a non-sm breakpoint", () => {
    render(ButtonSet);

    const element = screen.getByText("object-stacked").parentElement;
    expect(element).toHaveClass("bx--btn-set--stacked");
    expect(element).toHaveClass("bx--btn-set--lg-unstacked");
  });
});
