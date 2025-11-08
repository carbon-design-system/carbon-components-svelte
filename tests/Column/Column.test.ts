import { render, screen } from "@testing-library/svelte";
import Column from "./Column.test.svelte";

describe("Column", () => {
  it("should render with default props", () => {
    render(Column);
    const column = screen.getByTestId("content").parentElement;
    assert(column);
    expect(column).toHaveClass("bx--col");
  });

  it("should render with custom element when as is true", () => {
    render(Column, { props: { as: true } });
    const column = screen.getByTestId("content").parentElement;
    assert(column);
    expect(column.tagName).toBe("DIV");
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

  describe("Aspect ratio", () => {
    const ratios = ["2x1", "16x9", "9x16", "1x2", "4x3", "3x4", "1x1"] as const;

    ratios.forEach((ratio) => {
      it(`should apply ${ratio} aspect ratio`, () => {
        render(Column, {
          props: { aspectRatio: ratio },
        });
        const column = screen.getByTestId("content").parentElement;
        assert(column);
        expect(column).toHaveClass(
          "bx--aspect-ratio",
          `bx--aspect-ratio--${ratio}`,
        );
      });
    });
  });

  describe("Breakpoints", () => {
    const breakpoints = ["sm", "md", "lg", "xlg", "max"] as const;

    breakpoints.forEach((bp) => {
      it(`should handle boolean ${bp} breakpoint`, () => {
        render(Column, {
          props: { [bp]: true },
        });
        const column = screen.getByTestId("content").parentElement;
        assert(column);
        expect(column).toHaveClass(`bx--col-${bp}`);
      });

      it(`should handle numeric ${bp} breakpoint`, () => {
        render(Column, {
          props: { [bp]: 4 },
        });
        const column = screen.getByTestId("content").parentElement;
        assert(column);
        expect(column).toHaveClass(`bx--col-${bp}-4`);
      });

      it(`should handle object ${bp} breakpoint with span`, () => {
        render(Column, {
          props: { [bp]: { span: 4, offset: 2 } },
        });
        const column = screen.getByTestId("content").parentElement;
        assert(column);
        expect(column).toHaveClass(`bx--col-${bp}-4`, `bx--offset-${bp}-2`);
      });

      it(`should handle object ${bp} breakpoint with boolean span`, () => {
        render(Column, {
          props: { [bp]: { span: true, offset: 2 } },
        });
        const column = screen.getByTestId("content").parentElement;
        assert(column);
        expect(column).toHaveClass(`bx--col-${bp}`, `bx--offset-${bp}-2`);
      });
    });
  });

  it("should combine multiple breakpoint classes", () => {
    render(Column, {
      props: {
        sm: 4,
        md: { span: 6, offset: 2 },
        lg: true,
      },
    });
    const column = screen.getByTestId("content").parentElement;
    assert(column);
    expect(column).toHaveClass(
      "bx--col-sm-4",
      "bx--col-md-6",
      "bx--offset-md-2",
      "bx--col-lg",
    );
  });
});
