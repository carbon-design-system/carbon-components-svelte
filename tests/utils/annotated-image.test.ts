// @vitest-environment node
import {
  clampPercent,
  nudgePosition,
  pointToPercent,
} from "../../src/utils/annotated-image.js";

describe("pointToPercent", () => {
  const rect = { left: 100, top: 50, width: 400, height: 200 };

  it("maps a point to a percentage of the image's box", () => {
    expect(pointToPercent(rect, 300, 100)).toEqual({ x: 50, y: 25 });
  });

  it("gives the nearest edge for a point outside the image", () => {
    expect(pointToPercent(rect, 0, 900)).toEqual({ x: 0, y: 100 });
  });

  it("gives the center for an image with no size", () => {
    expect(pointToPercent({ ...rect, width: 0 }, 300, 100)).toEqual({
      x: 50,
      y: 50,
    });
  });
});

describe("nudgePosition", () => {
  it("moves by one percent, or ten with Shift, along the physical arrow", () => {
    expect(nudgePosition({ x: 50, y: 50 }, "ArrowLeft")).toEqual({
      x: 49,
      y: 50,
    });
    expect(nudgePosition({ x: 50, y: 50 }, "ArrowDown", true)).toEqual({
      x: 50,
      y: 60,
    });
  });

  it("stops at the edges and ignores other keys", () => {
    expect(nudgePosition({ x: 0, y: 100 }, "ArrowLeft")).toEqual({
      x: 0,
      y: 100,
    });
    expect(nudgePosition({ x: 5, y: 5 }, "a")).toBeNull();
  });
});

describe("clampPercent", () => {
  it("rounds to a tenth and treats a non-number as 0", () => {
    expect(clampPercent(33.333)).toBe(33.3);
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(140)).toBe(100);
  });
});
