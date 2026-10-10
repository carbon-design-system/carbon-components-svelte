import { render, screen } from "@testing-library/svelte";
import Prose from "./Prose.test.svelte";

describe("Prose", () => {
  it("renders a div with the base class and the slotted markup", () => {
    render(Prose);

    const prose = screen.getByTestId("prose");
    expect(prose.tagName).toBe("DIV");
    expect(prose).toHaveClass("bx--prose", "custom");
    expect(prose).not.toHaveClass("bx--prose--compact");
    expect(prose).not.toHaveClass("bx--prose--expressive");
    expect(
      screen.getByRole("heading", { level: 2, name: "Overview" }),
    ).toBeInTheDocument();
    expect(prose.style.maxWidth).toBe("");
  });

  it.each([
    ["condensed", "bx--prose--condensed"],
    ["compact", "bx--prose--compact"],
    ["spacious", "bx--prose--spacious"],
    ["expressive", "bx--prose--expressive"],
  ] as const)("adds the %s modifier", (variant, modifier) => {
    render(Prose, { props: { variant } });

    expect(screen.getByTestId("prose")).toHaveClass("bx--prose", modifier);
  });

  it("adds the defer-offscreen modifier with deferOffscreen", () => {
    render(Prose, { props: { deferOffscreen: true } });

    expect(screen.getByTestId("prose")).toHaveClass(
      "bx--prose--defer-offscreen",
    );
  });

  it.each([
    [480, "480px"],
    ["40rem", "40rem"],
    ["none", "none"],
  ])("sets maxWidth %s as %s", (maxWidth, expected) => {
    render(Prose, { props: { maxWidth } });

    expect(screen.getByTestId("prose").style.maxWidth).toBe(expected);
  });

  it("renders a custom tag", () => {
    render(Prose, { props: { tag: "article" } });

    expect(screen.getByTestId("prose").tagName).toBe("ARTICLE");
  });
});
