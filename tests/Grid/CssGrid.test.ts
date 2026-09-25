import { render } from "@testing-library/svelte";
import CssGrid from "./CssGrid.test.svelte";

describe("CssGrid", () => {
  it("should render a div.bx--css-grid by default", () => {
    const { container } = render(CssGrid);
    const grid = container.querySelector("div.bx--css-grid");
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toBe("bx--css-grid");
  });

  it.each([
    ["narrow", "bx--css-grid--narrow"],
    ["condensed", "bx--css-grid--condensed"],
    ["fullWidth", "bx--css-grid--full-width"],
    ["withRowGap", "bx--css-grid--with-row-gap"],
  ])("should add the %s class", (prop, className) => {
    const { container } = render(CssGrid, { props: { [prop]: true } });
    const grid = container.querySelector("div.bx--css-grid");
    expect(grid).toHaveClass(className);
  });

  it("should render as a custom element using the as prop", () => {
    const { container } = render(CssGrid, {
      props: { as: true, narrow: true },
    });
    const main = container.querySelector("main");
    expect(main).toHaveClass("bx--css-grid", "bx--css-grid--narrow");
    expect(container.querySelector("div.bx--css-grid")).toBeNull();
  });

  it("should support rest props", () => {
    const { container } = render(CssGrid, {
      props: { "data-testid": "custom-grid", "aria-label": "Grid layout" },
    });
    const grid = container.querySelector("[data-testid='custom-grid']");
    expect(grid).toHaveClass("bx--css-grid");
    expect(grid).toHaveAttribute("aria-label", "Grid layout");
  });
});
