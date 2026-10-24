// @vitest-environment node
import {
  fitMenuAxis,
  physicalAlign,
} from "carbon-components-svelte/utils/menu-placement.js";

describe("fitMenuAxis", () => {
  // A 150px menu in a 400px viewport.
  const place = (before: number, after: number, reverse = false) =>
    fitMenuAxis({ before, after, size: 150, max: 400, reverse });

  it.each([
    ["opens toward the far end from a pointer", 100, 100, 100],
    ["opens back from a pointer near the far edge", 350, 350, 200],
    ["opens past an anchor's far edge", 50, 200, 200],
    ["opens back from an anchor's near edge", 200, 300, 50],
    ["pins to the far edge when neither side fits", 100, 300, 250],
  ])("%s", (_, before, after, left) => {
    expect(place(before, after)).toBe(left);
  });

  it.each([
    ["opens back from a pointer", 300, 300, 150],
    ["opens toward the far end from a pointer near the near edge", 50, 50, 50],
    ["opens back from an anchor's near edge", 200, 300, 50],
    ["opens past an anchor's far edge", 100, 200, 200],
    ["pins to the near edge when neither side fits", 100, 300, 0],
  ])("in reverse, %s", (_, before, after, left) => {
    expect(place(before, after, true)).toBe(left);
  });

  it("keeps the start of a menu wider than the viewport on screen", () => {
    const options = { before: 100, after: 100, size: 500, max: 400 };
    expect(fitMenuAxis(options)).toBe(0);
    // In reverse the start is the far edge, so the overflow goes past 0.
    expect(fitMenuAxis({ ...options, reverse: true })).toBe(-100);
  });

  it("fits a menu that exactly fills the space on its side", () => {
    expect(place(250, 250)).toBe(250);
    expect(place(150, 150, true)).toBe(0);
  });
});

describe("physicalAlign", () => {
  it.each([
    ["start", false, "start"],
    ["end", false, "end"],
    ["center", false, "center"],
    ["start", true, "end"],
    ["end", true, "start"],
    ["center", true, "center"],
  ] as const)("maps %s (rtl: %s) to %s", (align, rtl, expected) => {
    expect(physicalAlign(align, rtl)).toBe(expected);
  });
});
