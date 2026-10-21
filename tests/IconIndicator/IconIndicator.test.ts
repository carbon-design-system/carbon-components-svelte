import { render, screen } from "@testing-library/svelte";
import UndefinedFilled from "../../src/icons/UndefinedFilled.svelte";
import WarningAltFilled from "../../src/icons/WarningAltFilled.svelte";
import WarningAltInvertedFilled from "../../src/icons/WarningAltInvertedFilled.svelte";
import IconIndicator from "./IconIndicator.test.svelte";

/** The `d` of each path, which tells one icon from another. */
const paths = (svg: Element | null) =>
  [...(svg?.querySelectorAll("path") ?? [])].map((p) => p.getAttribute("d"));

describe("IconIndicator", () => {
  // The caution kinds use Carbon v11's icons and read the support-caution-*
  // tokens (tests/css/indicator-tokens.test.ts).
  it.each([
    ["caution-major", WarningAltInvertedFilled],
    ["caution-minor", WarningAltFilled],
    ["undefined", UndefinedFilled],
  ] as const)(
    "draws the %s kind with its Carbon icon and label",
    (kind, Icon) => {
      render(IconIndicator);

      const indicator = screen
        .getByText(kind)
        .closest(".bx--icon-indicator") as HTMLElement;
      const svg = indicator.querySelector("svg");
      expect(svg).toHaveClass(`bx--icon-indicator--${kind}`);
      expect(paths(svg)).toEqual(
        paths(render(Icon).container.querySelector("svg")),
      );
      // The label names the status; the icon is decoration.
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByText(kind)).not.toHaveClass("bx--visually-hidden");
      expect(indicator).toHaveTextContent(kind);
    },
  );

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
