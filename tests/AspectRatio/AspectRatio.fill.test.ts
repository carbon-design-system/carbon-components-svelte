import { render, screen } from "@testing-library/svelte";
import AspectRatioFill from "./AspectRatio.fill.test.svelte";

describe("AspectRatio fill", () => {
  it("applies the fill class to the object wrapper", () => {
    render(AspectRatioFill);

    expect(screen.getByTestId("fill-content").parentElement).toHaveClass(
      "bx--aspect-ratio--object",
      "bx--aspect-ratio--fill",
    );
  });

  it("applies align and justify classes to the object wrapper", () => {
    render(AspectRatioFill);

    expect(screen.getByTestId("aligned-content").parentElement).toHaveClass(
      "bx--aspect-ratio--align-center",
      "bx--aspect-ratio--justify-end",
    );
  });

  it("applies the space-between justify class to the object wrapper", () => {
    render(AspectRatioFill);

    expect(
      screen.getByTestId("space-between-content").parentElement,
    ).toHaveClass("bx--aspect-ratio--justify-space-between");
  });
});
