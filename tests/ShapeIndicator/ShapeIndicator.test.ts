import { render, screen } from "@testing-library/svelte";
import ShapeIndicator from "./ShapeIndicator.test.svelte";

describe("ShapeIndicator", () => {
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
