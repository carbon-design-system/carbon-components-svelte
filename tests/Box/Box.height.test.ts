import { render, screen } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import Box from "./Box.height.test.svelte";

describe("Box height", () => {
  it("applies the viewport min height class", () => {
    render(Box);

    expect(screen.getByTestId("viewport-min-height")).toHaveClass(
      "bx--box-min-height-viewport",
    );
  });

  it("applies the height scale class", () => {
    render(Box);

    expect(screen.getByTestId("scale-height")).toHaveClass("bx--box-height-7");
  });

  it("applies a custom height via inline style", () => {
    render(Box);

    expectInlineStyle(screen.getByTestId("custom-height"), {
      height: "24rem",
    });
  });

  it("applies position and top classes together", () => {
    render(Box);

    const node = screen.getByTestId("sticky-top");
    expect(node).toHaveClass("bx--box-position-sticky", "bx--box-top-0");
  });

  it("applies the left offset class", () => {
    render(Box);

    const node = screen.getByTestId("sticky-left");
    expect(node).toHaveClass("bx--box-position-sticky", "bx--box-left-0");
  });

  it("applies a custom right offset via inline style", () => {
    render(Box);

    expectInlineStyle(screen.getByTestId("relative-right"), {
      right: "2rem",
    });
  });
});
