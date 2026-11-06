// @vitest-environment node
import {
  computeTouchAction,
  swipeDirection,
} from "../../src/utils/gesture-math.js";
import { createGestures, gesture } from "../../src/utils/gesture.js";

describe("gesture on the server", () => {
  it("imports without a DOM", () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
    expect(typeof createGestures).toBe("function");
    expect(gesture).toBe(createGestures);
  });

  it("keeps the pure helpers usable for server-computed styles", () => {
    expect(computeTouchAction({ swipe: "x" })).toBe("pan-y pinch-zoom");
    expect(
      swipeDirection({
        dx: 50,
        dy: 0,
        vx: 1,
        vy: 0,
        axis: "x",
        minDistance: 30,
        minVelocity: 0.3,
      }),
    ).toBe("right");
  });
});
