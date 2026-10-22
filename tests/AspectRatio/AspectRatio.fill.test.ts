import { render, screen } from "@testing-library/svelte";
import AspectRatioFill from "./AspectRatio.fill.test.svelte";

describe("AspectRatio fill", () => {
  it("applies fill, align and justify classes to the object wrapper", () => {
    render(AspectRatioFill);

    expect(screen.getByTestId("fill-content").parentElement).toHaveClass(
      "bx--aspect-ratio--object",
      "bx--aspect-ratio--fill",
    );
    expect(screen.getByTestId("aligned-content").parentElement).toHaveClass(
      "bx--aspect-ratio--align-center",
      "bx--aspect-ratio--justify-end",
    );
    expect(
      screen.getByTestId("space-between-content").parentElement,
    ).toHaveClass("bx--aspect-ratio--justify-space-between");
  });
});
