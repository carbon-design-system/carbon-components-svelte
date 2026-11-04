import {
  centeredView,
  clampView,
  createVelocityTracker,
  fitScale,
  inertiaStep,
  isDoubleTap,
  isZoomed,
  panBy,
  pinchGeometry,
  stepScale,
  toggleScale,
  wheelFactor,
  zoomAt,
} from "../../src/utils/image-zoom.js";

const natural = { width: 2000, height: 1000 };
const frame = { width: 500, height: 400 };
const bounds = { min: 0.25, max: 4 };

describe("fitScale", () => {
  it("fits the limiting side", () => {
    expect(fitScale(frame, natural)).toBe(0.25);
  });

  it("does not enlarge a small image", () => {
    expect(fitScale(frame, { width: 100, height: 100 })).toBe(1);
  });

  it("is 1 until both sizes are known", () => {
    expect(fitScale({ width: 0, height: 0 }, natural)).toBe(1);
    expect(fitScale(frame, { width: 0, height: 0 })).toBe(1);
  });
});

describe("clampView", () => {
  it("centers an image smaller than the frame on that axis", () => {
    // 2000 x 0.25 = 500 wide fills the frame; 1000 x 0.25 = 250 tall does not.
    expect(clampView({ scale: 0.25, x: 90, y: 90 }, natural, frame)).toEqual({
      scale: 0.25,
      x: 0,
      y: 75,
    });
  });

  it("keeps the frame covered once the image is larger", () => {
    const view = clampView({ scale: 1, x: 50, y: -2000 }, natural, frame);

    expect(view.x).toBe(0);
    expect(view.y).toBe(-600);
    expect(clampView({ scale: 1, x: -9999, y: 0 }, natural, frame).x).toBe(
      -1500,
    );
  });
});

describe("zoomAt", () => {
  it("keeps the image point under the anchor still", () => {
    const start = centeredView(0.25, natural, frame);
    const anchor = { x: 100, y: 200 };
    const next = zoomAt(start, 1, anchor, natural, frame, bounds);

    const imagePointBefore = (anchor.x - start.x) / start.scale;
    const imagePointAfter = (anchor.x - next.x) / next.scale;
    expect(imagePointAfter).toBeCloseTo(imagePointBefore);
    expect(next.scale).toBe(1);
  });

  it("clamps the scale to the bounds", () => {
    const start = centeredView(0.25, natural, frame);

    expect(
      zoomAt(start, 100, { x: 0, y: 0 }, natural, frame, bounds).scale,
    ).toBe(4);
    expect(
      zoomAt(start, 0.01, { x: 0, y: 0 }, natural, frame, bounds).scale,
    ).toBe(0.25);
  });

  it("stops at the image edge instead of showing past it", () => {
    const start = centeredView(0.25, natural, frame);
    const next = zoomAt(start, 1, { x: 0, y: 0 }, natural, frame, bounds);

    expect(next.x).toBe(0);
    expect(next.y).toBe(0);
  });
});

describe("panBy", () => {
  it("moves and clamps", () => {
    const view = { scale: 1, x: -100, y: -100 };

    expect(panBy(view, 40, -20, natural, frame)).toEqual({
      scale: 1,
      x: -60,
      y: -120,
    });
    expect(panBy(view, 1000, 1000, natural, frame)).toEqual({
      scale: 1,
      x: 0,
      y: 0,
    });
  });
});

describe("zoom steps", () => {
  it("steps by a factor within the bounds", () => {
    expect(stepScale(1, 1, 1.5, bounds)).toBe(1.5);
    expect(stepScale(1, -1, 2, bounds)).toBe(0.5);
    expect(stepScale(3, 1, 2, bounds)).toBe(4);
    expect(stepScale(0.3, -1, 2, bounds)).toBe(0.25);
  });

  it("treats a hair above fit as fit", () => {
    expect(isZoomed(0.25, 0.25)).toBe(false);
    expect(isZoomed(0.2501, 0.25)).toBe(false);
    expect(isZoomed(0.3, 0.25)).toBe(true);
  });

  it("toggles between fit and actual size", () => {
    expect(toggleScale(0.25, 0.25, 4)).toBe(1);
    expect(toggleScale(1, 0.25, 4)).toBe(0.25);
    expect(toggleScale(0.5, 0.25, 4)).toBe(0.25);
  });

  it("zooms an image that already fits to twice its fit scale", () => {
    expect(toggleScale(1, 1, 4)).toBe(2);
    expect(toggleScale(1, 1, 1.5)).toBe(1.5);
  });
});

describe("wheelFactor", () => {
  it("zooms in on a negative delta and out on a positive one", () => {
    expect(wheelFactor(-100, 0, false)).toBeGreaterThan(1);
    expect(wheelFactor(100, 0, false)).toBeLessThan(1);
    expect(wheelFactor(0, 0, false)).toBe(1);
  });

  it("is more sensitive for a pinch (ctrlKey)", () => {
    expect(wheelFactor(-5, 0, true)).toBeGreaterThan(wheelFactor(-5, 0, false));
  });

  it("reads lines and pages as pixels, and caps a huge delta", () => {
    expect(wheelFactor(-1, 1, false)).toBeCloseTo(wheelFactor(-16, 0, false));
    expect(wheelFactor(-1e6, 0, false)).toBe(wheelFactor(-300, 0, false));
  });
});

describe("pinchGeometry", () => {
  it("returns the distance and midpoint", () => {
    expect(pinchGeometry({ x: 0, y: 0 }, { x: 30, y: 40 })).toEqual({
      distance: 50,
      midpoint: { x: 15, y: 20 },
    });
  });
});

describe("isDoubleTap", () => {
  const first = { x: 10, y: 10, time: 1000 };

  it("needs a tap close in time and place", () => {
    expect(isDoubleTap(first, { x: 20, y: 15, time: 1200 })).toBe(true);
    expect(isDoubleTap(first, { x: 20, y: 15, time: 1400 })).toBe(false);
    expect(isDoubleTap(first, { x: 200, y: 15, time: 1100 })).toBe(false);
    expect(isDoubleTap(null, { x: 10, y: 10, time: 1100 })).toBe(false);
  });
});

describe("inertia", () => {
  it("finds the release velocity from recent samples", () => {
    const tracker = createVelocityTracker();
    tracker.add(0, 0, 0);
    tracker.add(50, 0, 50);
    tracker.add(100, 20, 100);

    expect(tracker.velocity()).toEqual({ x: 1, y: 0.2 });
  });

  it("forgets samples older than its window", () => {
    const tracker = createVelocityTracker(100);
    tracker.add(0, 0, 0);
    tracker.add(500, 0, 10);
    tracker.add(510, 0, 400);
    tracker.add(520, 0, 450);

    expect(tracker.velocity().x).toBeCloseTo(10 / 50);
  });

  it("has no velocity when the pointer stopped before release", () => {
    const tracker = createVelocityTracker();
    tracker.add(0, 0, 0);
    tracker.add(100, 0, 20);
    tracker.reset();
    tracker.add(100, 0, 500);

    expect(tracker.velocity()).toEqual({ x: 0, y: 0 });
  });

  it("decays towards a stop and never travels past v x time constant", () => {
    let velocity = { x: 2, y: 0 };
    let travelled = 0;
    for (let frameIndex = 0; frameIndex < 600; frameIndex++) {
      const step = inertiaStep(velocity, 16);
      travelled += step.dx;
      velocity = step.velocity;
    }

    expect(velocity.x).toBeLessThan(0.001);
    expect(travelled).toBeCloseTo(2 * 325, 0);
  });

  it("travels the same distance however it is split into frames", () => {
    const whole = inertiaStep({ x: 1, y: 0 }, 100);
    const half = inertiaStep({ x: 1, y: 0 }, 50);
    const rest = inertiaStep(half.velocity, 50);

    expect(half.dx + rest.dx).toBeCloseTo(whole.dx);
  });
});
