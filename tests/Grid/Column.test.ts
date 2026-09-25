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
});
