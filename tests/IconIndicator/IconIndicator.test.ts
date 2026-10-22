import { render, screen } from "@testing-library/svelte";
import CheckmarkFilled from "carbon-components-svelte/icons/CheckmarkFilled.svelte";
import CheckmarkOutline from "carbon-components-svelte/icons/CheckmarkOutline.svelte";
import CircleDash from "carbon-components-svelte/icons/CircleDash.svelte";
import ErrorFilled from "carbon-components-svelte/icons/ErrorFilled.svelte";
import Incomplete from "carbon-components-svelte/icons/Incomplete.svelte";
import InProgress from "carbon-components-svelte/icons/InProgress.svelte";
import PendingFilled from "carbon-components-svelte/icons/PendingFilled.svelte";
import UndefinedFilled from "carbon-components-svelte/icons/UndefinedFilled.svelte";
import UnknownFilled from "carbon-components-svelte/icons/UnknownFilled.svelte";
import WarningAltFilled from "carbon-components-svelte/icons/WarningAltFilled.svelte";
import WarningAltInvertedFilled from "carbon-components-svelte/icons/WarningAltInvertedFilled.svelte";
import WarningSquareFilled from "carbon-components-svelte/icons/WarningSquareFilled.svelte";
import IconIndicator from "./IconIndicator.test.svelte";

const glyphs = {
  failed: ErrorFilled,
  "caution-major": WarningAltInvertedFilled,
  "caution-minor": WarningAltFilled,
  undefined: UndefinedFilled,
  succeeded: CheckmarkFilled,
  normal: CheckmarkOutline,
  "in-progress": InProgress,
  incomplete: Incomplete,
  "not-started": CircleDash,
  pending: PendingFilled,
  unknown: UnknownFilled,
  informative: WarningSquareFilled,
};

describe("IconIndicator", () => {
  it("renders all kind variants with the correct icon class", () => {
    render(IconIndicator);

    const kinds = [
      "failed",
      "caution-major",
      "caution-minor",
      "undefined",
      "succeeded",
      "normal",
      "in-progress",
      "incomplete",
      "not-started",
      "pending",
      "unknown",
      "informative",
    ];

    for (const kind of kinds) {
      const indicator = screen
        .getByText(kind)
        .closest(".bx--icon-indicator") as HTMLElement;
      expect(indicator).toHaveClass("bx--icon-indicator");
      expect(indicator.querySelector("svg")).toHaveClass(
        `bx--icon-indicator--${kind}`,
      );
    }
  });

  it("renders the matching glyph for each kind", () => {
    render(IconIndicator);

    for (const [kind, Glyph] of Object.entries(glyphs)) {
      const indicator = screen
        .getByText(kind)
        .closest(".bx--icon-indicator") as HTMLElement;
      const { container } = render(Glyph, { size: 16 });

      expect(indicator.querySelector("svg")?.innerHTML).toBe(
        container.querySelector("svg")?.innerHTML,
      );
    }
  });

  it("defaults to a size of 16", () => {
    render(IconIndicator);

    const indicator = screen
      .getByText("failed")
      .closest(".bx--icon-indicator") as HTMLElement;
    expect(indicator).not.toHaveClass("bx--icon-indicator--20");
    expect(indicator.querySelector("svg")).toHaveAttribute("width", "16");
  });

  it("renders the 20px size modifier", () => {
    render(IconIndicator);

    const indicator = screen
      .getByText("size 20")
      .closest(".bx--icon-indicator") as HTMLElement;
    expect(indicator).toHaveClass("bx--icon-indicator--20");
    expect(indicator.querySelector("svg")).toHaveAttribute("width", "20");
  });

  it("overrides the label with labelChildren", () => {
    render(IconIndicator);

    const indicator = screen.getByTestId("label-children-test");
    expect(
      screen
        .getByText("Custom label content")
        .closest(".bx--icon-indicator") as HTMLElement,
    ).toBeInTheDocument();
    expect(indicator).not.toHaveTextContent("Default label");
  });

  it("hides the label visually with hideLabel, keeping it for screen readers", () => {
    render(IconIndicator);

    expect(screen.getByText("hidden label")).toHaveClass("bx--visually-hidden");
  });
});
