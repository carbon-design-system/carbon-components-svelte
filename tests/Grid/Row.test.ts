import { render, screen } from "@testing-library/svelte";
import Row from "./Row.test.svelte";

describe("Row", () => {
  it("should render with default props", () => {
    render(Row);
    const row = screen.getByTestId("test-row");
    expect(row).toHaveClass("bx--row");
    expect(row.tagName).toBe("DIV");
  });

  it("should apply the align class", () => {
    render(Row, { props: { align: "center" } });
    const row = screen.getByTestId("test-row");
    expect(row).toHaveClass("bx--row--align-center");
  });

  it("should keep a consumer class alongside the row class", () => {
    render(Row, { props: { className: "custom" } });
    expect(screen.getByTestId("test-row")).toHaveClass("bx--row", "custom");
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
        noGutter: true,
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
      "bx--no-gutter",
      "bx--no-gutter--left",
      "bx--no-gutter--right",
      "bx--row-padding",
    );
  });

  it("should pass all classes to custom element", () => {
    render(Row, {
      props: {
        as: true,
        condensed: true,
        narrow: true,
        noGutter: true,
        noGutterLeft: true,
        noGutterRight: true,
        padding: true,
      },
    });
    const row = screen.getByTestId("custom-row");
    expect(row).toHaveClass(
      "bx--row",
      "bx--row--condensed",
      "bx--row--narrow",
      "bx--no-gutter",
      "bx--no-gutter--left",
      "bx--no-gutter--right",
      "bx--row-padding",
    );
  });
});
