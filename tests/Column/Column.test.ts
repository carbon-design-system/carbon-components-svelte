import { render, screen } from "@testing-library/svelte";
import ColumnAs from "./Column.as.test.svelte";
import Column from "./Column.test.svelte";

describe("Column", () => {
  it("should render with default props", () => {
    render(Column);
    const column = screen.getByTestId("content").parentElement;
    assert(column);
    expect(column).toHaveClass("bx--col");
  });

  it("should hand the column props to the slot when as is true", () => {
    render(ColumnAs);
    const column = screen.getByTestId("content");
    expect(column.tagName).toBe("ARTICLE");
    expect(column).toHaveClass("bx--col-sm-4");
    expect(column).toHaveAttribute("aria-label", "Custom column");
    expect(column.parentElement?.querySelector("div.bx--col-sm-4")).toBeNull();
  });

  describe("Gutter modifiers", () => {
    it("should remove all gutters", () => {
      render(Column, { props: { noGutter: true } });
      const column = screen.getByTestId("content").parentElement;
      assert(column);
      expect(column).toHaveClass("bx--no-gutter");
    });

    it("should remove left gutter", () => {
      render(Column, { props: { noGutterLeft: true } });
      const column = screen.getByTestId("content").parentElement;
      assert(column);
      expect(column).toHaveClass("bx--no-gutter--left");
    });

    it("should remove right gutter", () => {
      render(Column, { props: { noGutterRight: true } });
      const column = screen.getByTestId("content").parentElement;
      assert(column);
      expect(column).toHaveClass("bx--no-gutter--right");
    });
  });

  it("should add padding", () => {
    render(Column, { props: { padding: true } });
    const column = screen.getByTestId("content").parentElement;
    assert(column);
    expect(column).toHaveClass("bx--col-padding");
  });

  describe("Breakpoint shapes", () => {
    it("should handle a boolean breakpoint", () => {
      render(Column, { props: { sm: true } });
      const column = screen.getByTestId("content").parentElement;
      assert(column);
      expect(column).toHaveClass("bx--col-sm");
    });

    it("should handle a numeric breakpoint", () => {
      render(Column, { props: { sm: 4 } });
      const column = screen.getByTestId("content").parentElement;
      assert(column);
      expect(column).toHaveClass("bx--col-sm-4");
    });

    it("should handle an object breakpoint with span", () => {
      render(Column, { props: { sm: { span: 4, offset: 2 } } });
      const column = screen.getByTestId("content").parentElement;
      assert(column);
      expect(column).toHaveClass("bx--col-sm-4", "bx--offset-sm-2");
    });

    it("should handle an object breakpoint with boolean span", () => {
      render(Column, { props: { sm: { span: true, offset: 2 } } });
      const column = screen.getByTestId("content").parentElement;
      assert(column);
      expect(column).toHaveClass("bx--col-sm", "bx--offset-sm-2");
    });
  });

  it("should skip a null breakpoint and keep the other breakpoint classes", () => {
    render(Column, {
      props: { sm: null as unknown as undefined, md: 4 },
    });
    const column = screen.getByTestId("content").parentElement;
    assert(column);
    expect(column).toHaveClass("bx--col-md-4");
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
    const column = screen.getByTestId("content").parentElement;
    assert(column);
    expect(column).toHaveClass(
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
