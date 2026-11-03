// @vitest-environment node
import {
  physicalAlign,
  popoverPlacement,
} from "carbon-components-svelte/utils/inline-align.js";
import type { TooltipAlign } from "carbon-components-svelte/utils/tooltip-align.js";
import { tooltipPlacement } from "carbon-components-svelte/utils/tooltip-align.js";

const VALUES = [
  ["top", "top", "center"],
  ["top-start", "top", "start"],
  ["top-end", "top", "end"],
  ["bottom", "bottom", "center"],
  ["bottom-start", "bottom", "start"],
  ["bottom-end", "bottom", "end"],
  ["left", "left", "center"],
  ["left-start", "left", "start"],
  ["left-end", "left", "end"],
  ["right", "right", "center"],
  ["right-start", "right", "start"],
  ["right-end", "right", "end"],
] as const satisfies ReadonlyArray<readonly [TooltipAlign, string, string]>;

/**
 * Where the tooltip lands, named as Popover's older physical placements.
 * Mirrors the tooltip logic: `physicalAlign` swaps `start` and `end` above
 * and below the anchor in RTL; beside it they stay on the block axis.
 */
function physicalPlacement(
  position: string,
  alignment: "start" | "center" | "end",
  rtl: boolean,
) {
  if (alignment === "center") return position;
  if (position === "top" || position === "bottom") {
    return `${position}-${physicalAlign(alignment, rtl) === "start" ? "left" : "right"}`;
  }
  return `${position}-${alignment === "start" ? "top" : "bottom"}`;
}

describe("tooltipPlacement", () => {
  it.each(VALUES)("splits %s into %s and %s", (align, position, alignment) => {
    expect(tooltipPlacement(align, "bottom", "center")).toEqual({
      position,
      alignment,
    });
  });

  it.each([false, true])(
    "lands where Popover's align does with rtl %s",
    (rtl) => {
      for (const [align] of VALUES) {
        const { position, alignment } = tooltipPlacement(
          align,
          "bottom",
          "center",
        );
        expect(physicalPlacement(position, alignment, rtl), align).toBe(
          popoverPlacement(align, rtl),
        );
      }
    },
  );

  it("swaps an inline start and end in RTL", () => {
    const { alignment } = tooltipPlacement("top-start", "bottom", "center");

    expect(physicalAlign(alignment, false)).toBe("start");
    expect(physicalAlign(alignment, true)).toBe("end");
  });

  it.each([undefined, ""])(
    "passes the older props through when tooltipAlign is %j",
    (align) => {
      expect(tooltipPlacement(align, "left", "end")).toEqual({
        position: "left",
        alignment: "end",
      });
    },
  );

  it.each(["start", "end", "center", "top-center", "top-left", "top-start-x"])(
    "ignores %s, which is not a floating-ui placement",
    (align) => {
      expect(tooltipPlacement(align, "right", "start")).toEqual({
        position: "right",
        alignment: "start",
      });
    },
  );
});
