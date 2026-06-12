import { render, screen } from "@testing-library/svelte";
import Text from "./Text.test.svelte";

describe("Text", () => {
  it("renders a <p> with the default body type", () => {
    render(Text);

    const node = screen.getByText("Default body");
    expect(node.tagName).toBe("P");
    expect(node).toHaveClass("bx--type-body-long-01");
  });

  it("renders a custom element via `tag` with the given type", () => {
    render(Text);

    const node = screen.getByText("Heading");
    expect(node.tagName).toBe("H1");
    expect(node).toHaveClass("bx--type-productive-heading-04");
  });

  it("applies a text color token class", () => {
    render(Text);

    expect(screen.getByText("Secondary text")).toHaveClass(
      "bx--type-text-secondary",
    );
  });

  it("merges type, color, and rest class", () => {
    render(Text);

    const node = screen.getByText("Code");
    expect(node).toHaveClass(
      "bx--type-code-01",
      "bx--type-text-error",
      "custom",
    );
  });

  it("renders an inline span", () => {
    render(Text);

    expect(screen.getByText("Inline span").tagName).toBe("SPAN");
  });

  it("keeps the default type style alongside a color", () => {
    render(Text);

    const node = screen.getByText("Color only");
    expect(node).toHaveClass("bx--type-body-long-01", "bx--type-text-helper");
  });

  it("applies font weight modifier classes", () => {
    render(Text);

    expect(screen.getByText("Semibold text")).toHaveClass("bx--type-semibold");
  });

  it("applies italic modifier class", () => {
    render(Text);

    expect(screen.getByText("Italic text")).toHaveClass("bx--type-italic");
  });

  it("applies font family modifier class", () => {
    render(Text);

    expect(screen.getByText("Mono text")).toHaveClass("bx--type-mono");
  });

  it("applies wrap modifier classes", () => {
    render(Text);

    expect(screen.getByText("Break word text")).toHaveClass(
      "bx--type-break-word",
    );
    expect(screen.getByText("Nowrap text")).toHaveClass("bx--type-nowrap");
  });

  it("applies balance modifier class", () => {
    render(Text);

    expect(screen.getByText("Balanced heading")).toHaveClass(
      "bx--type-balance",
    );
  });

  it("applies maxWidth as px when given a number", () => {
    render(Text);

    expect(screen.getByText("Max width px")).toHaveStyle({ maxWidth: "320px" });
  });

  it("applies maxWidth as a CSS length string", () => {
    render(Text);

    expect(screen.getByText("Max width ch")).toHaveStyle({ maxWidth: "38ch" });
  });

  it("applies full width modifier class", () => {
    render(Text);

    expect(screen.getByText("Full width text")).toHaveClass(
      "bx--type-full-width",
    );
  });

  it("merges multiple modifier classes", () => {
    render(Text);

    const node = screen.getByText("Combined modifiers");
    expect(node).toHaveClass(
      "bx--type-body-long-01",
      "bx--type-semibold",
      "bx--type-text-primary",
      "combined",
    );
    expect(node).toHaveStyle({ maxWidth: "42ch" });
  });

  it("applies multiline truncation when `lines` is set", () => {
    render(Text);

    expect(screen.getByText("Truncated text")).toHaveClass(
      "bx--text-truncate--multiline",
    );
  });
});
