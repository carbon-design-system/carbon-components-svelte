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

  describe("nested inside a CssColumn", () => {
    const innerGrid = (container: HTMLElement) =>
      container.querySelector("[data-testid='inner-grid']");

    it("should render a top-level grid, not a subgrid, with no CssColumn ancestor", () => {
      const { container } = render(CssGrid, {
        props: { layout: "nested" },
      });
      const outer = container.querySelector("[data-testid='outer-grid']");
      expect(outer?.className).toBe("bx--css-grid");
    });

    it("should render bx--subgrid instead of bx--css-grid", () => {
      const { container } = render(CssGrid, {
        props: { layout: "nested" },
      });
      const inner = innerGrid(container);
      expect(inner?.className).toBe("bx--subgrid");
      expect(inner).not.toHaveClass("bx--css-grid");
      expect(inner?.parentElement).toHaveClass("bx--css-grid-column");
    });

    it.each([
      ["wide", "bx--subgrid--wide"],
      ["narrow", "bx--subgrid--narrow"],
      ["condensed", "bx--subgrid--condensed"],
    ] as const)("should add the %s mode class", (mode, className) => {
      const { container } = render(CssGrid, {
        props: { layout: "nested", mode },
      });
      expect(innerGrid(container)?.className).toBe(`bx--subgrid ${className}`);
    });

    it.each(["narrow", "condensed", "fullWidth"])(
      "should silently ignore the top-level-only %s prop",
      (prop) => {
        const { container } = render(CssGrid, {
          props: { layout: "nested", [prop]: true },
        });
        expect(innerGrid(container)?.className).toBe("bx--subgrid");
      },
    );

    it("should add the subgrid row gap class, not the top-level one", () => {
      const { container } = render(CssGrid, {
        props: { layout: "nested", withRowGap: true },
      });
      const inner = innerGrid(container);
      expect(inner).toHaveClass("bx--subgrid", "bx--subgrid--with-row-gap");
      expect(inner).not.toHaveClass("bx--css-grid--with-row-gap");
    });

    it("should ignore mode on a top-level grid", () => {
      const { container } = render(CssGrid, { props: { mode: "wide" } });
      expect(container.querySelector("div.bx--css-grid")?.className).toBe(
        "bx--css-grid",
      );
    });

    it("should keep sibling top-level grids as plain grids", () => {
      const { container } = render(CssGrid, {
        props: { layout: "siblings" },
      });
      const first = container.querySelector("[data-testid='first-grid']");
      const second = container.querySelector("[data-testid='second-grid']");
      expect(first?.className).toBe("bx--css-grid");
      expect(second?.className).toBe("bx--css-grid");
      expect(container.querySelector(".bx--subgrid")).toBeNull();
    });
  });
});
