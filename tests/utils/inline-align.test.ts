// @vitest-environment node
import {
  isInlineAlign,
  physicalAlign,
  popoverPlacement,
} from "carbon-components-svelte/utils/inline-align.js";

describe("physicalAlign", () => {
  it.each([
    ["start", false, "start"],
    ["end", false, "end"],
    ["center", false, "center"],
    ["start", true, "end"],
    ["end", true, "start"],
    ["center", true, "center"],
  ] as const)("%s with rtl %s is %s", (align, rtl, expected) => {
    expect(physicalAlign(align, rtl)).toBe(expected);
  });
});

describe("popoverPlacement", () => {
  it.each([
    ["top-start", "top-left", "top-right"],
    ["top-end", "top-right", "top-left"],
    ["bottom-start", "bottom-left", "bottom-right"],
    ["bottom-end", "bottom-right", "bottom-left"],
    // Block-axis alignment does not follow the writing direction.
    ["left-start", "left-top", "left-top"],
    ["left-end", "left-bottom", "left-bottom"],
    ["right-start", "right-top", "right-top"],
    ["right-end", "right-bottom", "right-bottom"],
    // Physical names and bare sides stay.
    ["top-left", "top-left", "top-left"],
    ["bottom-right", "bottom-right", "bottom-right"],
    ["left-top", "left-top", "left-top"],
    ["top", "top", "top"],
    ["left", "left", "left"],
    ["right", "right", "right"],
  ])("%s is %s in LTR and %s in RTL", (align, ltr, rtl) => {
    expect(popoverPlacement(align, false)).toBe(ltr);
    expect(popoverPlacement(align, true)).toBe(rtl);
  });

  it("marks only the top and bottom start and end placements as inline", () => {
    const inline = [
      "top",
      "top-start",
      "top-end",
      "top-left",
      "bottom-start",
      "bottom-end",
      "left-start",
      "right-end",
    ].filter(isInlineAlign);
    expect(inline).toEqual([
      "top-start",
      "top-end",
      "bottom-start",
      "bottom-end",
    ]);
  });
});
