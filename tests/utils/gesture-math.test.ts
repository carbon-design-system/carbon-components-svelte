import {
  angleDelta,
  computeTouchAction,
  createVelocityTracker,
  inertiaStep,
  swipeDirection,
  wheelFactor,
} from "../../src/utils/gesture-math.js";

describe("computeTouchAction", () => {
  it.each([
    [{}, "auto"],
    [{ doubleTap: true }, "manipulation"],
    [{ pinch: true }, "none"],
    [{ pan: "both" }, "pinch-zoom"],
    [{ pan: "x" }, "pan-y pinch-zoom"],
    [{ pan: "y" }, "pan-x pinch-zoom"],
    [{ swipe: "x", doubleTap: true }, "pan-y pinch-zoom"],
    [{ pan: "x", swipe: "y" }, "pinch-zoom"],
    [{ pan: "x", pinch: true }, "none"],
    // A pan that waits for a long press leaves the page its scroll.
    [{ pan: null, doubleTap: true }, "manipulation"],
  ] as const)("%j is %s", (needs, expected) => {
    expect(computeTouchAction(needs as never)).toBe(expected);
  });
});

describe("createVelocityTracker", () => {
  it("measures over the recent window only", () => {
    const tracker = createVelocityTracker(100);
    tracker.add(0, 0, 0);
    tracker.add(500, 0, 400);
    tracker.add(600, 0, 450);
    tracker.add(700, 0, 500);
    expect(tracker.velocity().x).toBeCloseTo(2);
  });

  it("is zero for a pointer that rested before release", () => {
    const tracker = createVelocityTracker(100);
    tracker.add(0, 0, 0);
    tracker.add(50, 0, 40);
    tracker.add(50, 0, 700);
    expect(tracker.velocity()).toEqual({ x: 0, y: 0 });
  });

  it("is zero for one sample or a burst with one timestamp", () => {
    const tracker = createVelocityTracker();
    tracker.add(0, 0, 10);
    expect(tracker.velocity()).toEqual({ x: 0, y: 0 });
    tracker.add(40, 0, 10);
    expect(tracker.velocity()).toEqual({ x: 0, y: 0 });
  });
});

describe("swipeDirection", () => {
  const base = { minDistance: 30, minVelocity: 0.3 };

  it("needs distance, velocity, and the two to agree", () => {
    expect(
      swipeDirection({ ...base, dx: -80, dy: 5, vx: -1, vy: 0, axis: "x" }),
    ).toBe("left");
    expect(
      swipeDirection({ ...base, dx: 80, dy: 5, vx: 1, vy: 0, axis: "x" }),
    ).toBe("right");
    expect(
      swipeDirection({ ...base, dx: 10, dy: 0, vx: 1, vy: 0, axis: "x" }),
    ).toBeNull();
    expect(
      swipeDirection({ ...base, dx: 80, dy: 0, vx: 0.1, vy: 0, axis: "x" }),
    ).toBeNull();
    // Flicked back at the end.
    expect(
      swipeDirection({ ...base, dx: 80, dy: 0, vx: -1, vy: 0, axis: "x" }),
    ).toBeNull();
  });

  it("follows the axis", () => {
    const down = { ...base, dx: 4, dy: 90, vx: 0, vy: 1 };
    expect(swipeDirection({ ...down, axis: "x" })).toBeNull();
    expect(swipeDirection({ ...down, axis: "y" })).toBe("down");
    expect(swipeDirection({ ...down, axis: "both" })).toBe("down");
  });
});

describe("fling and wheel math", () => {
  it("decays a fling toward a stop and never reverses it", () => {
    let velocity = { x: 2, y: -1 };
    let total = 0;
    for (let i = 0; i < 100; i += 1) {
      const step = inertiaStep(velocity, 16);
      expect(step.dx).toBeGreaterThan(0);
      total += step.dx;
      velocity = step.velocity;
    }
    expect(Math.abs(velocity.x)).toBeLessThan(0.02);
    // The distance of an exponential fling is its velocity times the time constant.
    expect(total).toBeCloseTo(2 * 325, -1);
  });

  it("makes a trackpad pinch more sensitive than a wheel", () => {
    expect(wheelFactor(-3, 0, true)).toBeGreaterThan(wheelFactor(-3, 0, false));
    expect(wheelFactor(-100, 0, false)).toBeGreaterThan(1);
    expect(wheelFactor(100, 0, false)).toBeLessThan(1);
    expect(wheelFactor(-1, 1, false)).toBeCloseTo(wheelFactor(-16, 0, false));
  });

  it("wraps an angle across the seam", () => {
    expect(angleDelta(-3.1, 3.1)).toBeCloseTo(2 * Math.PI - 6.2);
    expect(angleDelta(0.2, 0.1)).toBeCloseTo(0.1);
  });
});
