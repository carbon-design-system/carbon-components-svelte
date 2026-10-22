import { render, screen } from "@testing-library/svelte";
import IconIndicator from "./IconIndicator.test.svelte";

describe("IconIndicator", () => {
  it.each([
    ["failed", 16, false],
    ["size 20", 20, true],
  ])("renders the %s indicator at width %i", (label, width, hasModifier) => {
    render(IconIndicator);

    const indicator = screen
      .getByText(label)
      .closest(".bx--icon-indicator") as HTMLElement;
    expect(indicator.classList.contains("bx--icon-indicator--20")).toBe(
      hasModifier,
    );
    expect(indicator.querySelector("svg")).toHaveAttribute(
      "width",
      String(width),
    );
  });

  it("hides the label visually with hideLabel, keeping it for screen readers", () => {
    render(IconIndicator);

    expect(screen.getByText("hidden label")).toHaveClass("bx--visually-hidden");
  });
});
