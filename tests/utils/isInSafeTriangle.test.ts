import { isInSafeTriangle } from "../../src/utils/isInSafeTriangle.js";

describe("isInSafeTriangle", () => {
  // Trigger row (fromRect) flush against a taller submenu (toRect) opening to
  // the right - the common case where a Menu submenu renders with zero gap.
  const fromRect = { top: 100, left: 0, right: 100, bottom: 120, height: 20 };
  const toRect = { top: 100, left: 100, right: 300, bottom: 300, height: 200 };

  it("returns true just past the trigger's edge, near the trigger's own row", () => {
    expect(isInSafeTriangle(105, 110, fromRect, toRect)).toBe(true);
  });

  it("returns true near the submenu's vertical center, further from the edge", () => {
    expect(isInSafeTriangle(110, 200, fromRect, toRect)).toBe(true);
  });

  it("returns false for a point outside the wedge (mid-height, away from the edge)", () => {
    expect(isInSafeTriangle(110, 150, fromRect, toRect)).toBe(false);
  });

  it("returns false for a point far past the submenu's bottom", () => {
    expect(isInSafeTriangle(105, 400, fromRect, toRect)).toBe(false);
  });

  it("returns false for a point still inside the trigger, left of the wedge", () => {
    expect(isInSafeTriangle(50, 110, fromRect, toRect)).toBe(false);
  });

  it("mirrors the wedge when the submenu opens to the left", () => {
    const leftToRect = { top: 100, left: -300, right: -100, bottom: 300, height: 200 };
    const leftFromRect = { top: 100, left: -100, right: 0, bottom: 120, height: 20 };
    expect(isInSafeTriangle(-105, 200, leftFromRect, leftToRect)).toBe(true);
    expect(isInSafeTriangle(-105, 400, leftFromRect, leftToRect)).toBe(false);
  });

  it("shifts the safe zone once a real gap separates the two rects", () => {
    const gappedToRect = { top: 100, left: 140, right: 340, bottom: 300, height: 200 };
    // A point that succeeds against the flush toRect can fall outside the
    // wedge once a real gap pushes the near edge further from the trigger.
    expect(isInSafeTriangle(110, 150, fromRect, gappedToRect)).toBe(true);
    expect(isInSafeTriangle(115, 150, fromRect, gappedToRect)).toBe(false);
  });
});
