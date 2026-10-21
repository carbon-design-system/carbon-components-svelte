import { render, screen } from "@testing-library/svelte";
import Caution from "../../src/icons/Caution.svelte";
import DiamondFill from "../../src/icons/DiamondFill.svelte";
import LowSeverity from "../../src/icons/LowSeverity.svelte";
import ShapeIndicator from "./ShapeIndicator.test.svelte";

/** The `d` of each path, which tells one shape from another. */
const paths = (svg: Element | null) =>
  [...(svg?.querySelectorAll("path") ?? [])].map((p) => p.getAttribute("d"));

describe("ShapeIndicator", () => {
  // The caution kinds use Carbon v11's shapes and read the support-caution-*
  // tokens (tests/css/indicator-tokens.test.ts).
  it.each([
    ["medium", DiamondFill],
    ["low", LowSeverity],
    ["cautious", Caution],
    ["undefined", DiamondFill],
  ] as const)(
    "draws the %s kind with its Carbon shape and label",
    (kind, Shape) => {
      render(ShapeIndicator);

      const indicator = screen.getByText(kind);
      const svg = indicator.querySelector("svg");
      expect(indicator).toHaveClass("bx--shape-indicator");
      expect(svg).toHaveClass(`bx--shape-indicator--${kind}`);
      expect(paths(svg)).toEqual(
        paths(render(Shape).container.querySelector("svg")),
      );
      // The label names the status; the shape is decoration.
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(indicator).toHaveTextContent(kind);
    },
  );

  it.each([
    ["failed", false],
    ["text size 14", true],
  ])(
    "renders the %s indicator with the 14px modifier: %s",
    (label, hasModifier) => {
      render(ShapeIndicator);

      expect(
        screen.getByText(label).classList.contains("bx--shape-indicator--14"),
      ).toBe(hasModifier);
    },
  );
});
