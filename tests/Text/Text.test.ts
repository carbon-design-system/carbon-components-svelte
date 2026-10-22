import { render, screen } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import Text from "./Text.test.svelte";

describe("Text", () => {
  it("renders a <p> with the default body type", () => {
    render(Text);

    const node = screen.getByText("Default body");
    expect(node.tagName).toBe("P");
    expect(node).toHaveClass("bx--type-body-01");
  });

  it("renders a custom element via `tag` with the given type", () => {
    render(Text);

    const node = screen.getByText("Heading");
    expect(node.tagName).toBe("H1");
    expect(node).toHaveClass("bx--type-heading-04");
  });

  it.each([
    ["Secondary text", "bx--type-text-secondary"],
    ["Success text", "bx--type-text-success"],
    ["Link text", "bx--type-text-link"],
    ["Semibold text", "bx--type-semibold"],
    ["Italic text", "bx--type-italic"],
    ["Mono text", "bx--type-mono"],
    ["Break word text", "bx--type-break-word"],
    ["Nowrap text", "bx--type-nowrap"],
    ["Balanced heading", "bx--type-balance"],
    ["Pretty-wrapped paragraph", "bx--type-pretty"],
    ["Full width text", "bx--type-full-width"],
  ])("applies the modifier class for %s", (text, expectedClass) => {
    render(Text);

    expect(screen.getByText(text)).toHaveClass(expectedClass);
  });

  it("omits the type class when `type` is inherit", () => {
    render(Text);

    const node = screen.getByText("Inherited type");
    expect(node).toHaveClass("bx--type-text-error");
    expect(node.className).not.toMatch(/bx--type-(?!text-)/);
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

  it.each([
    ["Max width px", "320px"],
    ["Max width ch", "38ch"],
  ])("applies maxWidth for %s", (text, maxWidth) => {
    render(Text);

    expectInlineStyle(screen.getByText(text), { maxWidth });
  });

  it("applies multiline truncation when `lines` is set", () => {
    render(Text);

    expect(screen.getByText("Truncated text")).toHaveClass(
      "bx--text-truncate--multiline",
    );
  });

  it("clamps a single line from the front", () => {
    render(Text);

    const node = screen.getByText("Front clamped");
    expect(node).toHaveClass("bx--text-truncate--front");
    expect(node).not.toHaveClass("bx--text-truncate--end");
  });

  it.each([
    ["type", { truncatedType: "body-02" as const }],
    ["style", { truncatedStyle: "color: red" }],
  ])("keeps truncation when `%s` changes after mount", async (_, props) => {
    const { rerender } = render(Text);

    await rerender(props);

    const node = screen.getByText("Truncated text");
    expect(node).toHaveClass("bx--text-truncate--multiline");
    expectInlineStyle(node, { "--ccs-truncate-lines": "3" });
  });
});
