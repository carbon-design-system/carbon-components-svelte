import { render, screen } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import Divider from "./Divider.test.svelte";

describe("Divider", () => {
  it("renders a horizontal separator by default", () => {
    render(Divider);

    const node = screen.getByTestId("default");
    expect(node.tagName).toBe("HR");
    expect(node).toHaveAttribute("role", "separator");
    expect(node).not.toHaveAttribute("aria-orientation");
  });

  it("sets aria-orientation only when vertical", () => {
    render(Divider);

    expect(screen.getByTestId("vertical")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  });

  it("renders a decorative divider with no role and aria-hidden", () => {
    render(Divider);

    const node = screen.getByTestId("decorative");
    expect(node).not.toHaveAttribute("role");
    expect(node).toHaveAttribute("aria-hidden", "true");
  });

  it("applies a scale-step margin class", () => {
    render(Divider);

    expect(screen.getByTestId("margin-scale").className).toContain(
      "bx--divider-margin-y-5",
    );
  });

  it("applies a custom margin as an inline style", () => {
    render(Divider);

    expectInlineStyle(screen.getByTestId("margin-custom"), {
      marginBlock: "2rem",
    });
  });

  it("applies a vertical scale-step margin as an inline-axis class", () => {
    render(Divider);

    const node = screen.getByTestId("vertical-margin-scale");
    expect(node).toHaveClass("bx--divider-margin-x-5");
    expect(node.className).not.toContain("bx--divider-margin-y-");
  });

  it("applies a vertical custom margin to the inline axis only", () => {
    render(Divider);

    expectInlineStyle(screen.getByTestId("vertical-margin-custom"), {
      marginInline: "2rem",
      marginBlock: "",
    });
  });

  it("omits aria-orientation on a decorative vertical divider", () => {
    render(Divider);

    expect(screen.getByTestId("decorative-vertical")).not.toHaveAttribute(
      "aria-orientation",
    );
  });
});
