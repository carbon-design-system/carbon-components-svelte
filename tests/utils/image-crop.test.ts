// @vitest-environment node
import {
  clampRect,
  containsRect,
  fitFrame,
  frameView,
  initialRect,
  layerTransform,
  limitRect,
  maxCropSize,
  mirrorRect,
  normalizeAngle,
  outputSize,
  resizeRect,
  rotatedSize,
  rotateRect,
  roundRect,
  scaleRect,
  zoomLimit,
  zoomOf,
} from "../../src/utils/image-crop.js";

const image = { width: 600, height: 400 };

describe("rotatedSize", () => {
  it("swaps the sides at a quarter turn and grows at 45 degrees", () => {
    expect(rotatedSize(image, 0)).toEqual({ width: 600, height: 400 });
    expect(rotatedSize(image, 90)).toEqual({ width: 400, height: 600 });
    expect(rotatedSize(image, -270)).toEqual({ width: 400, height: 600 });
    const turned = rotatedSize(image, 45);
    expect(turned.width).toBeCloseTo((600 + 400) / Math.SQRT2, 3);
    expect(turned.height).toBeCloseTo((600 + 400) / Math.SQRT2, 3);
  });
});

describe("normalizeAngle", () => {
  it("wraps into (-180, 180]", () => {
    expect(normalizeAngle(270)).toBe(-90);
    expect(normalizeAngle(-180)).toBe(180);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(Number.NaN)).toBe(0);
  });
});

describe("maxCropSize", () => {
  it("is the whole image for its own ratio at no rotation", () => {
    expect(maxCropSize(image, 0, 3 / 2)).toEqual({ width: 600, height: 400 });
  });

  it("fits a square in a landscape image by its short side", () => {
    expect(maxCropSize(image, 0, 1)).toEqual({ width: 400, height: 400 });
  });

  it("shrinks as the image turns, and the result fits", () => {
    for (const angle of [5, 17, 30, 45, 80]) {
      const size = maxCropSize(image, angle, 1);
      const bounds = rotatedSize(image, angle);
      const rect = {
        x: bounds.width / 2 - size.width / 2,
        y: bounds.height / 2 - size.height / 2,
        ...size,
      };
      expect(containsRect(image, angle, rect)).toBe(true);
      // And it is the largest: 2% bigger no longer fits.
      const bigger = {
        x: bounds.width / 2 - size.width * 0.51,
        y: bounds.height / 2 - size.height * 0.51,
        width: size.width * 1.02,
        height: size.height * 1.02,
      };
      expect(containsRect(image, angle, bigger)).toBe(false);
    }
  });
});

describe("containsRect", () => {
  it("rejects the empty corner of the bounds of a turned image", () => {
    const bounds = rotatedSize(image, 30);
    expect(containsRect(image, 30, { x: 0, y: 0, width: 50, height: 50 })).toBe(
      false,
    );
    expect(
      containsRect(image, 30, {
        x: bounds.width / 2 - 25,
        y: bounds.height / 2 - 25,
        width: 50,
        height: 50,
      }),
    ).toBe(true);
  });
});

describe("clampRect", () => {
  it("slides a rect back inside an unrotated image", () => {
    expect(
      clampRect(image, 0, { x: -50, y: 380, width: 100, height: 100 }),
    ).toEqual({ x: 0, y: 300, width: 100, height: 100 });
  });

  it("shrinks a rect that is too big, about its center", () => {
    const clamped = clampRect(image, 0, {
      x: 100,
      y: 100,
      width: 800,
      height: 400,
    });
    expect(clamped.width).toBeCloseTo(600, 6);
    expect(clamped.height).toBeCloseTo(300, 6);
  });

  it("grows to the minimum size when the image has room", () => {
    const clamped = clampRect(
      image,
      0,
      { x: 10, y: 10, width: 4, height: 4 },
      { minWidth: 64, minHeight: 64 },
    );
    expect(clamped.width).toBe(64);
    expect(clamped.height).toBe(64);
  });

  it("lets the image win over a minimum it can't satisfy", () => {
    const clamped = clampRect(
      image,
      0,
      { x: 0, y: 0, width: 100, height: 100 },
      { minWidth: 2000, minHeight: 2000 },
    );
    expect(clamped.width).toBeLessThanOrEqual(600);
    expect(clamped.height).toBeLessThanOrEqual(400);
    expect(containsRect(image, 0, clamped)).toBe(true);
  });

  it("slides along the edge of a rotated image and stays inside", () => {
    for (const angle of [10, 33, 45, 90, 135, -20]) {
      const clamped = clampRect(image, angle, {
        x: -500,
        y: 900,
        width: 120,
        height: 90,
      });
      expect(containsRect(image, angle, clamped)).toBe(true);
    }
  });

  it("leaves a rect that already fits where it is", () => {
    const rect = { x: 100, y: 80, width: 200, height: 150 };
    const clamped = clampRect(image, 0, rect);
    expect(clamped.x).toBeCloseTo(100, 6);
    expect(clamped.y).toBeCloseTo(80, 6);
  });
});

describe("initialRect", () => {
  it("centers the largest rect of the ratio", () => {
    expect(initialRect(image, 0, 1)).toEqual({
      x: 100,
      y: 0,
      width: 400,
      height: 400,
    });
  });

  it("takes the bounds' ratio without one", () => {
    expect(initialRect(image, 90)).toEqual({
      x: 0,
      y: 0,
      width: 400,
      height: 600,
    });
  });
});

describe("scaleRect", () => {
  it("keeps the anchor at the same relative place", () => {
    const rect = { x: 100, y: 100, width: 200, height: 100 };
    const scaled = scaleRect(rect, 0.5, { x: 200, y: 150 });
    expect(scaled).toEqual({ x: 150, y: 125, width: 100, height: 50 });
  });
});

describe("resizeRect", () => {
  const rect = { x: 100, y: 100, width: 200, height: 100 };

  it("moves one edge of a free box", () => {
    expect(resizeRect(rect, "e", 40, 99)).toEqual({
      x: 100,
      y: 100,
      width: 240,
      height: 100,
    });
    expect(resizeRect(rect, "w", 40, 0)).toEqual({
      x: 140,
      y: 100,
      width: 160,
      height: 100,
    });
    expect(resizeRect(rect, "nw", -10, -20)).toEqual({
      x: 90,
      y: 80,
      width: 210,
      height: 120,
    });
  });

  it("stops at the minimum instead of inverting", () => {
    expect(
      resizeRect(rect, "e", -500, 0, { minWidth: 32, minHeight: 32 }),
    ).toMatchObject({ x: 100, width: 32 });
    expect(
      resizeRect(rect, "w", 500, 0, { minWidth: 32, minHeight: 32 }),
    ).toMatchObject({ x: 268, width: 32 });
  });

  it("keeps a ratio and anchors the opposite corner", () => {
    const next = resizeRect(rect, "se", 100, 0, { ratio: 2 });
    expect(next).toEqual({ x: 100, y: 100, width: 300, height: 150 });
    const nw = resizeRect(rect, "nw", -100, -100, { ratio: 2 });
    expect(nw.x + nw.width).toBe(300);
    expect(nw.y + nw.height).toBe(200);
    expect(nw.width / nw.height).toBe(2);
  });

  it("centers the other axis when an edge of a locked box moves", () => {
    const next = resizeRect(rect, "e", 100, 0, { ratio: 2 });
    expect(next.width).toBe(300);
    expect(next.height).toBe(150);
    expect(next.y).toBe(75);
  });
});

describe("limitRect", () => {
  it("backs off to the edge instead of leaving the image", () => {
    const previous = { x: 100, y: 100, width: 200, height: 200 };
    const proposed = { x: 100, y: 100, width: 800, height: 200 };
    const limited = limitRect(image, 0, previous, proposed);
    expect(containsRect(image, 0, limited)).toBe(true);
    expect(limited.width).toBeGreaterThan(200);
  });

  it("lets a free corner slide along an edge of an unturned image", () => {
    const previous = { x: 100, y: 100, width: 200, height: 100 };
    const proposed = { x: 100, y: 100, width: 900, height: 150 };
    expect(limitRect(image, 0, previous, proposed)).toEqual({
      x: 100,
      y: 100,
      width: 500,
      height: 150,
    });
  });

  it("holds for a turned image", () => {
    const start = initialRect(image, 25, 1);
    const smaller = scaleRect(start, 0.5);
    const proposed = resizeRect(smaller, "se", 900, 900, { ratio: 1 });
    const limited = limitRect(image, 25, smaller, proposed);
    expect(containsRect(image, 25, limited)).toBe(true);
    expect(limited.width).toBeGreaterThan(smaller.width);
  });
});

describe("mirrorRect", () => {
  it("mirrors across the middle of the bounds", () => {
    const bounds = { width: 600, height: 400 };
    const rect = { x: 50, y: 20, width: 100, height: 60 };
    expect(mirrorRect(bounds, rect, "x")).toEqual({
      x: 450,
      y: 20,
      width: 100,
      height: 60,
    });
    expect(mirrorRect(bounds, rect, "y")).toEqual({
      x: 50,
      y: 320,
      width: 100,
      height: 60,
    });
  });
});

describe("rotateRect", () => {
  it("keeps the image point under the center through a quarter turn", () => {
    // A 100x100 crop at the top-left of a 600x400 image.
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const turned = rotateRect(image, 0, 90, rect);
    // Clockwise, the top-left corner of the image moves to the top-right
    // of the 400x600 bounds.
    expect(turned.x).toBeCloseTo(300, 6);
    expect(turned.y).toBeCloseTo(0, 6);
    expect(turned.width).toBe(100);
  });

  it("undoes a turn with the opposite turn", () => {
    const rect = { x: 120, y: 60, width: 160, height: 90 };
    const there = rotateRect(image, 0, 90, rect);
    const back = rotateRect(image, 90, 0, there);
    expect(back.x).toBeCloseTo(rect.x, 6);
    expect(back.y).toBeCloseTo(rect.y, 6);
  });

  it("swaps the sides of a free box and holds a straightened box inside", () => {
    const rect = { x: 100, y: 100, width: 200, height: 100 };
    expect(rotateRect(image, 0, 90, rect, { swap: true })).toMatchObject({
      width: 100,
      height: 200,
    });
    const straightened = rotateRect(image, 0, 20, {
      x: 0,
      y: 0,
      width: 600,
      height: 400,
    });
    expect(containsRect(image, 20, straightened)).toBe(true);
  });
});

describe("views", () => {
  it("fits a frame to a ratio with padding", () => {
    expect(fitFrame({ width: 400, height: 300 }, 2, 20)).toEqual({
      x: 20,
      y: 60,
      width: 360,
      height: 180,
    });
  });

  it("puts the rect's corner on the frame's corner", () => {
    const view = frameView(
      { x: 20, y: 20, width: 200, height: 200 },
      { x: 100, y: 50, width: 400, height: 400 },
    );
    expect(view).toEqual({ scale: 0.5, x: -30, y: -5 });
  });

  it("writes a transform that centers the rotated image", () => {
    const transform = layerTransform(image, 90, true, false, {
      scale: 2,
      x: 10,
      y: 20,
    });
    // Bounds are 400 x 600; the center is (200, 300) in bounds space.
    expect(transform).toBe(
      "translate(410px, 620px) scale(2) rotate(90deg) scale(-1, 1) translate(-300px, -200px)",
    );
  });
});

describe("zoom", () => {
  it("is 1 for the largest crop and doubles when it halves", () => {
    const full = initialRect(image, 0, 1);
    expect(zoomOf(image, 0, full)).toBeCloseTo(1, 6);
    expect(zoomOf(image, 0, scaleRect(full, 0.5))).toBeCloseTo(2, 6);
  });

  it("stops at the minimum output size", () => {
    expect(
      zoomLimit(image, 0, 1, { maxZoom: 8, minWidth: 100, minHeight: 100 }),
    ).toBe(4);
    expect(
      zoomLimit(image, 0, 1, { maxZoom: 3, minWidth: 100, minHeight: 100 }),
    ).toBe(3);
    // A source under the minimum can't zoom at all.
    expect(zoomLimit(image, 0, 1, { minWidth: 1000, minHeight: 1000 })).toBe(1);
  });
});

describe("roundRect", () => {
  it("rounds to whole pixels inside the bounds", () => {
    expect(
      roundRect(image, 0, { x: 0.4, y: 10.6, width: 599.7, height: 389.2 }),
    ).toEqual({ x: 0, y: 11, width: 600, height: 389 });
  });
});

describe("outputSize", () => {
  it("scales to a width, keeping the ratio", () => {
    expect(outputSize({ width: 800, height: 400 }, { width: 200 })).toEqual({
      width: 200,
      height: 100,
      limited: false,
    });
  });

  it("stays within the pixel budget", () => {
    const size = outputSize(
      { width: 6000, height: 4000 },
      { maxPixels: 1_000_000 },
    );
    expect(size.limited).toBe(true);
    expect(size.width * size.height).toBeLessThanOrEqual(1_000_000);
    expect(size.width / size.height).toBeCloseTo(1.5, 1);
  });
});
