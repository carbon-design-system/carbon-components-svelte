import { render, screen } from "@testing-library/svelte";
import ProgressIndicator from "./ProgressIndicator.responsive.test.svelte";

describe("ProgressIndicator responsive vertical", () => {
  it("emits no vertical class by default", () => {
    render(ProgressIndicator);

    const element = screen.getByTestId("scalar-default");
    expect(element).not.toHaveClass("bx--progress--vertical");
  });

  it("keeps scalar vertical output unchanged", () => {
    render(ProgressIndicator);

    const element = screen.getByTestId("scalar-vertical");
    expect(element).toHaveClass("bx--progress--vertical");
  });

  it("emits an explicit -horizontal override for false at a non-sm breakpoint", () => {
    render(ProgressIndicator);

    const element = screen.getByTestId("object-vertical");
    expect(element).toHaveClass("bx--progress--vertical");
    expect(element).toHaveClass("bx--progress--md-horizontal");
  });
});
