import { render, screen } from "@testing-library/svelte";
import Row from "./Row.test.svelte";

describe("Row", () => {
  it("should render with default props", () => {
    render(Row);
    const row = screen.getByTestId("test-row");
    expect(row).toHaveClass("bx--row");
    expect(row.tagName).toBe("DIV");
  });

  it("should render condensed variant", () => {
    render(Row, { props: { condensed: true } });
    const row = screen.getByTestId("test-row");
    expect(row).toHaveClass("bx--row--condensed");
  });

  it("should render narrow variant", () => {
    render(Row, { props: { narrow: true } });
    const row = screen.getByTestId("test-row");
    expect(row).toHaveClass("bx--row--narrow");
  });

  it("should remove all gutters", () => {
    render(Row, { props: { noGutter: true } });
    const row = screen.getByTestId("test-row");
    expect(row).toHaveClass("bx--no-gutter");
  });

  it("should remove left gutter", () => {
    render(Row, { props: { noGutterLeft: true } });
    const row = screen.getByTestId("test-row");
    expect(row).toHaveClass("bx--no-gutter--left");
  });

  it("should remove right gutter", () => {
    render(Row, { props: { noGutterRight: true } });
    const row = screen.getByTestId("test-row");
    expect(row).toHaveClass("bx--no-gutter--right");
  });

  it("should add padding", () => {
    render(Row, { props: { padding: true } });
    const row = screen.getByTestId("test-row");
    expect(row).toHaveClass("bx--row-padding");
  });

  it("should render as custom element when as is true", () => {
    render(Row, { props: { as: true } });
    const row = screen.getByTestId("custom-row");
    expect(row.tagName).toBe("SECTION");
    expect(row).toHaveClass("bx--row");
  });

  it("should combine multiple classes", () => {
    render(Row, {
      props: {
        condensed: true,
        narrow: true,
        noGutterLeft: true,
        noGutterRight: true,
        padding: true,
      },
    });
    const row = screen.getByTestId("test-row");
    expect(row).toHaveClass(
      "bx--row",
      "bx--row--condensed",
      "bx--row--narrow",
      "bx--no-gutter--left",
      "bx--no-gutter--right",
      "bx--row-padding",
    );
  });

  it("should pass custom attributes via rest props", () => {
    render(Row);
    const row = screen.getByTestId("test-row");
    expect(row).toHaveAttribute("data-testid", "test-row");
  });

  it("should pass all classes to custom element", () => {
    render(Row, {
      props: {
        as: true,
        condensed: true,
        narrow: true,
        noGutter: true,
        padding: true,
      },
    });
    const row = screen.getByTestId("custom-row");
    expect(row).toHaveClass(
      "bx--row",
      "bx--row--condensed",
      "bx--row--narrow",
      "bx--no-gutter",
      "bx--row-padding",
    );
  });
});
