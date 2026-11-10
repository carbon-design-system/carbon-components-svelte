// @vitest-environment node
import { cubicBezier } from "../../src/motion/cubic-bezier.js";
import { easing } from "../../src/motion/tokens.js";

describe("cubicBezier", () => {
  it("clamps to the endpoints", () => {
    const ease = cubicBezier(0.2, 0, 0.38, 0.9);
    expect(ease(-1)).toBe(0);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(2)).toBe(1);
  });

  it("is the identity for a line through the corners", () => {
    const linear = cubicBezier(0.25, 0.25, 0.75, 0.75);
    for (const t of [0.1, 0.33, 0.5, 0.9]) {
      expect(linear(t)).toBeCloseTo(t, 5);
    }
  });

  it("matches CSS ease-in-out at the midpoint", () => {
    // cubic-bezier(0.42, 0, 0.58, 1) is symmetric about (0.5, 0.5).
    expect(cubicBezier(0.42, 0, 0.58, 1)(0.5)).toBeCloseTo(0.5, 5);
  });

  it("solves a curve whose x slope is flat at the start", () => {
    // x1 = 0 makes the slope zero at s = 0, so Newton's method must fall back.
    const ease = cubicBezier(0, 0, 0.38, 0.9);
    expect(ease(0.001)).toBeGreaterThanOrEqual(0);
    expect(ease(0.5)).toBeGreaterThan(0.5);
  });

  it("is monotonic for every Carbon curve", () => {
    for (const modes of Object.values(easing)) {
      for (const fn of Object.values(modes)) {
        let previous = 0;
        for (let i = 1; i <= 100; i++) {
          const value = fn(i / 100);
          expect(value).toBeGreaterThanOrEqual(previous);
          previous = value;
        }
      }
    }
  });
});
