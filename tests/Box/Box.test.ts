import { render, screen } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import BoxRef from "./Box.ref.test.svelte";
import Box from "./Box.test.svelte";

describe("Box", () => {
  it("renders a default div", () => {
    render(Box);

    const node = screen.getByText("Default box");
    expect(node.tagName).toBe("DIV");
  });

  it("binds `ref` to the rendered element", async () => {
    const { rerender } = render(BoxRef);

    expect(screen.getByTestId("ref-tag")).toHaveTextContent("DIV");
    expect(screen.getByText("Anchor")).toBeInTheDocument();

    // `tag` swaps the element, so the binding has to follow it.
    await rerender({ tag: "section" });
    expect(screen.getByTestId("ref-tag")).toHaveTextContent("SECTION");
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

  it("applies dashed border style only when a border token is set", () => {
    render(Box);

    expect(screen.getByText("Dashed border")).toHaveClass(
      "bx--box-border-strong",
      "bx--box-border-style-dashed",
    );
    expect(screen.getByText("No border, dashed style")).not.toHaveClass(
      "bx--box-border-style-dashed",
    );
  });

  it("applies border width only when a border token is set", () => {
    render(Box);

    expectInlineStyle(screen.getByText("Thick border"), {
      borderWidth: "2px",
    });
    expectInlineStyle(screen.getByText("No border, custom width"), {
      borderWidth: "",
    });
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

    expectInlineStyle(screen.getByText("Custom padding"), {
      padding: "1.5rem",
    });
  });

  it("applies width utilities and inline sizes", () => {
    render(Box);

    expect(screen.getByText("Full width capped")).toHaveClass(
      "bx--box-full-width",
    );
    expectInlineStyle(screen.getByText("Full width capped"), {
      maxWidth: "480px",
    });
    expectInlineStyle(screen.getByText("Custom width"), {
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
