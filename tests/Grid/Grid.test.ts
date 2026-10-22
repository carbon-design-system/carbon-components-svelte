import { render } from "@testing-library/svelte";
import Grid from "./Grid.test.svelte";

describe("Grid", () => {
  describe("Default", () => {
    it("should support rest props", () => {
      const { container } = render(Grid, {
        props: {
          "data-testid": "custom-grid",
          "aria-label": "Grid layout",
        },
      });
      const grid = container.querySelector("[data-testid='custom-grid']");
      expect(grid).toHaveClass("bx--grid");
      expect(grid).toHaveAttribute("aria-label", "Grid layout");
    });
  });

  it("should render as a custom element using the as prop", () => {
    const { container } = render(Grid, { props: { as: true } });

    const header = container.querySelector("header");
    expect(header).toHaveClass("bx--grid");
  });

  it("should pass all variant classes and rest props to custom element", () => {
    const { container } = render(Grid, {
      props: {
        as: true,
        condensed: true,
        narrow: true,
        fullWidth: true,
        noGutter: true,
        noGutterLeft: true,
        noGutterRight: true,
        padding: true,
        "data-testid": "custom-header",
        "aria-label": "Custom header grid",
      },
    });
    const header = container.querySelector("[data-testid='custom-header']");
    expect(header).toHaveClass(
      "bx--grid",
      "bx--grid--condensed",
      "bx--grid--narrow",
      "bx--grid--full-width",
      "bx--no-gutter",
      "bx--no-gutter--left",
      "bx--no-gutter--right",
      "bx--row-padding",
    );
    expect(header).toHaveAttribute("aria-label", "Custom header grid");
  });

  it("should combine multiple variant classes", () => {
    const { container } = render(Grid, {
      props: {
        condensed: true,
        narrow: true,
        fullWidth: true,
        noGutter: true,
        noGutterLeft: true,
        noGutterRight: true,
        padding: true,
      },
    });
    const grid = container.querySelector("div.bx--grid");
    expect(grid).toHaveClass(
      "bx--grid",
      "bx--grid--condensed",
      "bx--grid--narrow",
      "bx--grid--full-width",
      "bx--no-gutter",
      "bx--no-gutter--left",
      "bx--no-gutter--right",
      "bx--row-padding",
    );
  });
});
