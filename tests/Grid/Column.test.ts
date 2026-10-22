import { render, screen } from "@testing-library/svelte";
import ColumnAs from "./Column.as.test.svelte";
import Column from "./Column.test.svelte";

describe("Column", () => {
  it("should hand the column props to the slot when as is true", () => {
    render(ColumnAs);
    const column = screen.getByTestId("content");
    expect(column.tagName).toBe("ARTICLE");
    expect(column).toHaveClass("bx--col-sm-4");
    expect(column).toHaveAttribute("aria-label", "Custom column");
    expect(column.parentElement?.querySelector("div.bx--col-sm-4")).toBeNull();
  });

  it("should render aspectRatio 2x3", () => {
    render(Column, { props: { aspectRatio: "2x3" } });
    const col = screen.getByTestId("test-col");
    expect(col).toHaveClass("bx--aspect-ratio", "bx--aspect-ratio--2x3");
  });

  it("should apply the align class", () => {
    render(Column, { props: { align: "end" } });
    const col = screen.getByTestId("test-col");
    expect(col).toHaveClass("bx--col--align-end");
  });

  it("should not render aspect ratio classes when aspectRatio is unset", () => {
    render(Column);
    const col = screen.getByTestId("test-col");
    expect(col).not.toHaveClass("bx--aspect-ratio");
    expect(col).toHaveClass("bx--col");
  });

  it.each([
    ["noGutter", "bx--no-gutter"],
    ["noGutterLeft", "bx--no-gutter--left"],
    ["noGutterRight", "bx--no-gutter--right"],
    ["padding", "bx--col-padding"],
  ])("should apply the %s class", (prop, className) => {
    render(Column, { props: { [prop]: true } });
    expect(screen.getByTestId("test-col")).toHaveClass(className);
  });

  it("should render a span-only descriptor without an offset class", () => {
    render(Column);
    const col = screen.getByTestId("test-col-span-only");
    expect(col).toHaveClass("bx--col-sm-4");
    expect(col.className).not.toMatch(/bx--offset-sm-/);
  });

  it.each([
    ["boolean", true, ["bx--col-sm"]],
    ["numeric", 4, ["bx--col-sm-4"]],
    [
      "object with span",
      { span: 4, offset: 2 },
      ["bx--col-sm-4", "bx--offset-sm-2"],
    ],
    [
      "object with boolean span",
      { span: true, offset: 2 },
      ["bx--col-sm", "bx--offset-sm-2"],
    ],
    [
      "object with span and offset",
      { span: 1, offset: 3 },
      ["bx--col-sm-1", "bx--offset-sm-3"],
    ],
    [
      "object with offset 0 (the guard checks typeof, not truthiness)",
      { span: 4, offset: 0 },
      ["bx--col-sm-4", "bx--offset-sm-0"],
    ],
  ])("should render the %s breakpoint shape", (_, sm, classes) => {
    render(Column, { props: { sm } });
    expect(screen.getByTestId("test-col")).toHaveClass(...classes);
  });

  it("should skip a null breakpoint and keep the other breakpoint classes", () => {
    render(Column, { props: { sm: null, md: 4 } });
    expect(screen.getByTestId("test-col")).toHaveClass("bx--col-md-4");
  });

  it("should combine multiple breakpoint classes", () => {
    render(Column, {
      props: {
        sm: 4,
        md: { span: 6, offset: 2 },
        lg: true,
        xlg: { span: true, offset: 1 },
        max: 8,
      },
    });
    expect(screen.getByTestId("test-col")).toHaveClass(
      "bx--col-sm-4",
      "bx--col-md-6",
      "bx--offset-md-2",
      "bx--col-lg",
      "bx--col-xlg",
      "bx--offset-xlg-1",
      "bx--col-max-8",
    );
  });
});
