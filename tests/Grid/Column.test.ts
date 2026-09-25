import { render, screen } from "@testing-library/svelte";
import Column from "./Column.test.svelte";

describe("Column", () => {
  it("should render aspectRatio 2x3", () => {
    render(Column, { props: { aspectRatio: "2x3" } });
    const col = screen.getByTestId("test-col");
    expect(col).toHaveClass("bx--aspect-ratio", "bx--aspect-ratio--2x3");
  });

  it("should render aspectRatio 3x2", () => {
    render(Column, { props: { aspectRatio: "3x2" } });
    const col = screen.getByTestId("test-col");
    expect(col).toHaveClass("bx--aspect-ratio", "bx--aspect-ratio--3x2");
  });

  it("should not render aspect ratio classes when aspectRatio is unset", () => {
    render(Column);
    const col = screen.getByTestId("test-col");
    expect(col).not.toHaveClass("bx--aspect-ratio");
    expect(col).toHaveClass("bx--col");
  });

  it("should render a span-only descriptor without an offset class", () => {
    render(Column);
    const col = screen.getByTestId("test-col-span-only");
    expect(col).toHaveClass("bx--col-sm-4");
    expect(col.className).not.toMatch(/bx--offset-sm-/);
  });

  it("should render both span and offset classes when both keys are set", () => {
    render(Column, { props: { sm: { span: 1, offset: 3 } } });
    const col = screen.getByTestId("test-col");
    expect(col).toHaveClass("bx--col-sm-1", "bx--offset-sm-3");
  });

  it("should render offset 0 since the guard checks typeof, not truthiness", () => {
    render(Column, { props: { sm: { span: 4, offset: 0 } } });
    const col = screen.getByTestId("test-col");
    expect(col).toHaveClass("bx--offset-sm-0");
  });
});
