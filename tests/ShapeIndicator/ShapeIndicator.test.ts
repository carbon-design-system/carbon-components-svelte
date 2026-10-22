import { render, screen } from "@testing-library/svelte";
import Caution from "carbon-components-svelte/icons/Caution.svelte";
import CircleFill from "carbon-components-svelte/icons/CircleFill.svelte";
import CircleStroke from "carbon-components-svelte/icons/CircleStroke.svelte";
import Critical from "carbon-components-svelte/icons/Critical.svelte";
import CriticalSeverity from "carbon-components-svelte/icons/CriticalSeverity.svelte";
import DiamondFill from "carbon-components-svelte/icons/DiamondFill.svelte";
import LowSeverity from "carbon-components-svelte/icons/LowSeverity.svelte";
import ShapeIndicatorIncomplete from "carbon-components-svelte/ShapeIndicator/ShapeIndicatorIncomplete.svelte";
import ShapeIndicator from "./ShapeIndicator.test.svelte";

const shapes = {
  failed: Critical,
  critical: CriticalSeverity,
  high: Caution,
  medium: DiamondFill,
  low: LowSeverity,
  cautious: Caution,
  undefined: DiamondFill,
  stable: CircleFill,
  informative: LowSeverity,
  incomplete: ShapeIndicatorIncomplete,
  draft: CircleStroke,
};

describe("ShapeIndicator", () => {
  it("renders all kind variants with the correct shape class", () => {
    render(ShapeIndicator);

    const kinds = [
      "failed",
      "critical",
      "high",
      "medium",
      "low",
      "cautious",
      "undefined",
      "stable",
      "informative",
      "incomplete",
      "draft",
    ];

    for (const kind of kinds) {
      const indicator = screen.getByText(kind);
      expect(indicator).toHaveClass("bx--shape-indicator");
      expect(indicator.querySelector("svg")).toHaveClass(
        `bx--shape-indicator--${kind}`,
      );
    }
  });

  it("renders the matching shape for each kind", () => {
    render(ShapeIndicator);

    for (const [kind, Shape] of Object.entries(shapes)) {
      const indicator = screen.getByText(kind);
      const { container } = render(Shape, { size: 16 });

      expect(indicator.querySelector("svg")?.innerHTML).toBe(
        container.querySelector("svg")?.innerHTML,
      );
    }
  });

  it("defaults to a text size of 12", () => {
    render(ShapeIndicator);

    const indicator = screen.getByText("failed");
    expect(indicator).not.toHaveClass("bx--shape-indicator--14");
  });

  it("renders the 14px text size modifier", () => {
    render(ShapeIndicator);

    const indicator = screen.getByText("text size 14");
    expect(indicator).toHaveClass("bx--shape-indicator--14");
  });

  it("overrides the label with labelChildren", () => {
    render(ShapeIndicator);

    const indicator = screen.getByTestId("label-children-test");
    expect(screen.getByText("Custom label content")).toBeInTheDocument();
    expect(indicator).not.toHaveTextContent("Default label");
  });
});
