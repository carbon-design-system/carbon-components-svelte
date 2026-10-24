import { render, screen } from "@testing-library/svelte";
import CssGrid from "./CssGrid.test.svelte";

function className(testId: string) {
  return screen.getByTestId(testId).className;
}

describe("CssGrid", () => {
  it("renders a centered grid by default", () => {
    render(CssGrid);
    const grid = screen.getByTestId("grid");
    expect(grid.tagName).toBe("DIV");
    expect(grid.className).toBe("bx--css-grid");
    expect(grid).toHaveAttribute("aria-label", "Layout");
  });

  it.each([
    [{ narrow: true }, "bx--css-grid bx--css-grid--narrow"],
    [{ condensed: true }, "bx--css-grid bx--css-grid--condensed"],
    [{ narrow: true, condensed: true }, "bx--css-grid bx--css-grid--narrow"],
    [{ fullWidth: true }, "bx--css-grid bx--css-grid--full-width"],
    [{ withRowGap: true }, "bx--css-grid bx--css-grid--with-row-gap"],
    [{ align: "start" }, "bx--css-grid bx--css-grid--start"],
    [{ align: "end" }, "bx--css-grid bx--css-grid--end"],
  ] as const)("renders %j as %s", (props, expected) => {
    render(CssGrid, { props });
    expect(className("grid")).toBe(expected);
  });

  it("passes the classes to a custom element", () => {
    render(CssGrid, { props: { as: true, narrow: true } });
    const grid = screen.getByTestId("grid");
    expect(grid.tagName).toBe("MAIN");
    expect(grid.className).toBe("bx--css-grid bx--css-grid--narrow");
  });

  describe("nested", () => {
    it("renders a wide subgrid by default", () => {
      render(CssGrid, { props: { nested: true } });
      expect(className("grid")).toBe("bx--css-grid");
      expect(className("subgrid")).toBe("bx--subgrid bx--subgrid--wide");
      expect(className("deep")).toBe("bx--subgrid bx--subgrid--wide");
      expect(className("sibling")).toBe("bx--css-grid");
    });

    it.each([
      [{ narrow: true }, "bx--subgrid bx--subgrid--narrow"],
      [{ condensed: true }, "bx--subgrid bx--subgrid--condensed"],
      [
        { withRowGap: true },
        "bx--subgrid bx--subgrid--wide bx--subgrid--with-row-gap",
      ],
      [{ fullWidth: true, align: "end" }, "bx--subgrid bx--subgrid--wide"],
    ] as const)("renders %j as %s", (props, expected) => {
      render(CssGrid, { props: { nested: true, ...props } });
      expect(className("subgrid")).toBe(expected);
    });
  });
});
