import { isInSafeTriangle } from "../../src/utils/isInSafeTriangle.js";

describe("isInSafeTriangle", () => {
  test("true for a point crossing diagonally toward a floating element on the right", () => {
    const anchorRect = { left: 0, right: 100, top: 0, bottom: 40 };
    const floatingRect = {
      left: 120,
      right: 220,
      top: 0,
      bottom: 200,
      height: 200,
    };

    expect(isInSafeTriangle(113, 117, anchorRect, floatingRect)).toBe(true);
  });

  test("false for a point far from the gap between anchor and floating element", () => {
    const anchorRect = { left: 0, right: 100, top: 0, bottom: 40 };
    const floatingRect = {
      left: 120,
      right: 220,
      top: 0,
      bottom: 200,
      height: 200,
    };

    expect(isInSafeTriangle(50, 500, anchorRect, floatingRect)).toBe(false);
  });

  test("true for a point crossing diagonally toward a floating element on the left", () => {
    const anchorRect = { left: 100, right: 200, top: 0, bottom: 40 };
    const floatingRect = {
      left: -20,
      right: 80,
      top: 0,
      bottom: 200,
      height: 200,
    };

    expect(isInSafeTriangle(95, 100, anchorRect, floatingRect)).toBe(true);
  });

  test("false for a point on the wrong side of the anchor", () => {
    const anchorRect = { left: 100, right: 200, top: 0, bottom: 40 };
    const floatingRect = {
      left: -20,
      right: 80,
      top: 0,
      bottom: 200,
      height: 200,
    };

    expect(isInSafeTriangle(300, 300, anchorRect, floatingRect)).toBe(false);
  });
});
