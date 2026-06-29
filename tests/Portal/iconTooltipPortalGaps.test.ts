import { iconTooltipPortalGaps } from "carbon-components-svelte/Portal/iconTooltipPortalGaps.js";

describe("iconTooltipPortalGaps", () => {
  test("vertical placements only add a top/bottom gap", () => {
    expect(iconTooltipPortalGaps("bottom", "center")).toEqual({
      horizontalGapLeft: 0,
      horizontalGapRight: 0,
      gapTop: 1,
      gapBottom: 1,
      verticalAlignOffsetLeft: 0,
      verticalAlignOffsetRight: 0,
    });
    expect(iconTooltipPortalGaps("top", "center").gapTop).toBe(1);
    expect(iconTooltipPortalGaps("top", "center").horizontalGapLeft).toBe(0);
  });

  test("horizontal placements only add a left/right gap", () => {
    const gaps = iconTooltipPortalGaps("right", "center");
    expect(gaps.horizontalGapLeft).toBe(2);
    expect(gaps.horizontalGapRight).toBe(2);
    expect(gaps.gapTop).toBe(0);
    expect(gaps.gapBottom).toBe(0);
  });

  test("nudges the caret only for left/start and right/end", () => {
    expect(iconTooltipPortalGaps("left", "start").verticalAlignOffsetLeft).toBe(
      -3,
    );
    expect(iconTooltipPortalGaps("right", "end").verticalAlignOffsetRight).toBe(
      1,
    );
    // No nudge for other alignment combinations.
    expect(iconTooltipPortalGaps("left", "end").verticalAlignOffsetLeft).toBe(
      0,
    );
    expect(
      iconTooltipPortalGaps("right", "center").verticalAlignOffsetRight,
    ).toBe(0);
  });
});
