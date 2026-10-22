import { render, screen, within } from "@testing-library/svelte";
import Caution from "carbon-components-svelte/icons/Caution.svelte";
import CheckmarkFilled from "carbon-components-svelte/icons/CheckmarkFilled.svelte";
import CheckmarkOutline from "carbon-components-svelte/icons/CheckmarkOutline.svelte";
import CircleDash from "carbon-components-svelte/icons/CircleDash.svelte";
import CircleFill from "carbon-components-svelte/icons/CircleFill.svelte";
import CircleStroke from "carbon-components-svelte/icons/CircleStroke.svelte";
import Critical from "carbon-components-svelte/icons/Critical.svelte";
import CriticalSeverity from "carbon-components-svelte/icons/CriticalSeverity.svelte";
import DiamondFill from "carbon-components-svelte/icons/DiamondFill.svelte";
import ErrorFilled from "carbon-components-svelte/icons/ErrorFilled.svelte";
import Incomplete from "carbon-components-svelte/icons/Incomplete.svelte";
import InProgress from "carbon-components-svelte/icons/InProgress.svelte";
import LowSeverity from "carbon-components-svelte/icons/LowSeverity.svelte";
import PendingFilled from "carbon-components-svelte/icons/PendingFilled.svelte";
import UndefinedFilled from "carbon-components-svelte/icons/UndefinedFilled.svelte";
import UnknownFilled from "carbon-components-svelte/icons/UnknownFilled.svelte";
import WarningAltFilled from "carbon-components-svelte/icons/WarningAltFilled.svelte";
import WarningAltInvertedFilled from "carbon-components-svelte/icons/WarningAltInvertedFilled.svelte";
import WarningSquareFilled from "carbon-components-svelte/icons/WarningSquareFilled.svelte";
import ShapeIndicatorIncomplete from "carbon-components-svelte/ShapeIndicator/ShapeIndicatorIncomplete.svelte";
import ShapeIndicatorFixture from "../ShapeIndicator/ShapeIndicator.test.svelte";
import IconIndicatorFixture from "./IconIndicator.test.svelte";

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

/**
 * Behavior `IconIndicator` and `ShapeIndicator` share. Each row picks the
 * fixture (one indicator per kind, labelled with the kind), the BEM block, and
 * the kind-to-glyph map.
 */
const variants = [
  {
    name: "IconIndicator",
    Fixture: IconIndicatorFixture,
    block: "icon-indicator",
    glyphs,
  },
  {
    name: "ShapeIndicator",
    Fixture: ShapeIndicatorFixture,
    block: "shape-indicator",
    glyphs: shapes,
  },
] as const;

describe.each(variants)("$name (shared)", ({ Fixture, block, glyphs }) => {
  const getIndicator = (label: string) =>
    screen.getByText(label).closest(`.bx--${block}`) as HTMLElement;

  it.each(Object.keys(glyphs))("renders the %s kind class", (kind) => {
    render(Fixture);

    const indicator = getIndicator(kind);
    expect(indicator).toHaveClass(`bx--${block}`);
    expect(indicator.querySelector("svg")).toHaveClass(`bx--${block}--${kind}`);
  });

  it.each(Object.entries(glyphs))(
    "renders the matching glyph for %s",
    (kind, Glyph) => {
      render(Fixture);

      const { container } = render(Glyph, { size: 16 });

      expect(getIndicator(kind).querySelector("svg")?.innerHTML).toBe(
        container.querySelector("svg")?.innerHTML,
      );
    },
  );

  it("overrides the label with labelChildren", () => {
    render(Fixture);

    const indicator = screen.getByTestId("label-children-test");
    expect(
      within(indicator).getByText("Custom label content"),
    ).toBeInTheDocument();
    expect(indicator).not.toHaveTextContent("Default label");
  });
});
