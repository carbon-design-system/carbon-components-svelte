import { render, screen } from "@testing-library/svelte";
import Box from "./Box.test.svelte";

describe("Box", () => {
  it("renders a default div", () => {
    render(Box);

    const node = screen.getByText("Default box");
    expect(node.tagName).toBe("DIV");
  });

  it("renders a custom element via `tag`", () => {
    render(Box);

    expect(screen.getByText("Layer fill").tagName).toBe("SECTION");
  });

  it("applies fill utility classes", () => {
    render(Box);

    expect(screen.getByText("Layer fill")).toHaveClass("bx--box-fill-layer-01");
    expect(screen.getByText("Fill and border")).toHaveClass(
      "bx--box-fill-background",
    );
  });

  it("applies border utility classes", () => {
    render(Box);

    expect(screen.getByText("Fill and border")).toHaveClass(
      "bx--box-border-subtle",
    );
  });

  it("applies spacing scale classes", () => {
    render(Box);

    expect(screen.getByText("Padding scale")).toHaveClass("bx--box-p-5");
    expect(screen.getByText("Axis padding")).toHaveClass(
      "bx--box-px-3",
      "bx--box-py-5",
    );
    expect(screen.getByText("Margin scale")).toHaveClass("bx--box-m-4");
  });

  it("applies custom padding via inline style", () => {
    render(Box);

    expect(screen.getByText("Custom padding")).toHaveStyle({
      padding: "1.5rem",
    });
  });

  it("applies width utilities and inline sizes", () => {
    render(Box);

    expect(screen.getByText("Full width capped")).toHaveClass(
      "bx--box-full-width",
    );
    expect(screen.getByText("Full width capped")).toHaveStyle({
      maxWidth: "480px",
    });
    expect(screen.getByText("Custom width")).toHaveStyle({
      width: "12rem",
      minWidth: "8rem",
    });
  });

  it("merges multiple modifier classes", () => {
    render(Box);

    const node = screen.getByText("Combined modifiers");
    expect(node).toHaveClass(
      "bx--box-fill-layer-02",
      "bx--box-p-6",
      "bx--box-border-subtle",
      "combined",
    );
  });
});
