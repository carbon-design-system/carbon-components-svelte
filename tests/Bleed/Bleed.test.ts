import { render, screen } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import Bleed from "./Bleed.test.svelte";

describe("Bleed", () => {
  it("applies scale-step negative-margin classes on every side", () => {
    render(Bleed);

    const node = screen.getByTestId("scale");
    expect(node).toHaveClass(
      "bx--bleed",
      "bx--bleed-top-5",
      "bx--bleed-right-5",
      "bx--bleed-bottom-5",
      "bx--bleed-left-5",
    );
    expect(node.getAttribute("style")).toBeNull();
  });

  it("negates a custom string value with calc()", () => {
    render(Bleed);

    // jsdom folds `calc(-1 * (2rem))` to `calc(-2rem)`.
    const node = screen.getByTestId("custom");
    expectInlineStyle(node, {
      marginTop: "",
      marginRight: "calc(-2rem)",
      marginBottom: "",
      marginLeft: "calc(-2rem)",
    });
    expect(node.className).not.toContain("bx--bleed-right-");
  });

  it("negates a CSS variable, which a bare `-` prefix would break", () => {
    render(Bleed);

    const node = screen.getByTestId("custom-var");
    expectInlineStyle(node, {
      marginTop: "calc(-1 * (var(--gap)))",
      marginBottom: "calc(-1 * (var(--gap)))",
    });
  });

  it("lets a per-side prop override the axis prop for that side only", () => {
    render(Bleed);

    const node = screen.getByTestId("per-side");
    expect(node.className).not.toContain("bx--bleed-top-");
    expect(node).toHaveClass("bx--bleed-bottom-5");
    expect(node.className).not.toContain("bx--bleed-left-");
  });

  it("renders a custom tag", () => {
    render(Bleed);

    expect(screen.getByTestId("tag").tagName).toBe("SECTION");
  });
});
