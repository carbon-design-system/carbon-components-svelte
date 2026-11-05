// @vitest-environment node
import {
  computePosition,
  formatPlacement,
  parsePlacement,
  slideWithin,
} from "carbon-components-svelte/utils/compute-position.js";

const rect = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

const window1000 = { left: 0, top: 0, right: 1000, bottom: 800 };

describe("parsePlacement", () => {
  it.each([
    ["bottom", false, "bottom", "center"],
    ["top-start", false, "top", "start"],
    ["top-start", true, "top", "end"],
    ["bottom-end", true, "bottom", "start"],
    // On a left or right side, start and end are the top and the bottom.
    ["left-start", true, "left", "start"],
    ["right-end", true, "right", "end"],
    ["bottom-left", true, "bottom", "start"],
    ["top-right", true, "top", "end"],
    ["left-top", false, "left", "start"],
    ["right-bottom", false, "right", "end"],
    // `start` and `end` as sides name the inline sides.
    ["start", false, "left", "center"],
    ["start", true, "right", "center"],
    ["end-start", false, "right", "start"],
    ["end-start", true, "left", "start"],
  ] as const)("reads %s (rtl: %s)", (placement, rtl, side, align) => {
    expect(parsePlacement(placement, rtl)).toEqual({ side, align });
  });

  it("formats a side and an alignment in either vocabulary", () => {
    expect(formatPlacement("bottom", "start")).toBe("bottom-left");
    expect(formatPlacement("left", "end")).toBe("left-bottom");
    expect(formatPlacement("bottom", "start", { logical: true })).toBe(
      "bottom-start",
    );
    expect(
      formatPlacement("bottom", "start", { logical: true, rtl: true }),
    ).toBe("bottom-end");
    expect(formatPlacement("top", "center")).toBe("top");
  });
});

describe("computePosition", () => {
  const anchor = rect(400, 300, 100, 40);
  const box = { width: 200, height: 100 };

  it.each([
    ["bottom", 350, 340],
    ["top", 350, 200],
    ["left", 200, 270],
    ["right", 500, 270],
    ["bottom-start", 400, 340],
    ["bottom-end", 300, 340],
    ["top-start", 400, 200],
    ["left-start", 200, 300],
    ["right-end", 500, 240],
  ])("places %s", (placement, x, y) => {
    expect(computePosition(anchor, box, { placement })).toMatchObject({
      x,
      y,
    });
  });

  it("offsets along the side and along the edge", () => {
    expect(
      computePosition(anchor, box, {
        placement: "bottom-start",
        offset: { main: 8, cross: -4 },
      }),
    ).toMatchObject({ x: 396, y: 348 });
    expect(
      computePosition(anchor, box, {
        placement: "left",
        offset: ({ side }) => (side === "left" ? 16 : 0),
      }),
    ).toMatchObject({ x: 184 });
  });

  it("reads start and end as inline sides in RTL", () => {
    const rtl = computePosition(anchor, box, {
      placement: "bottom-start",
      rtl: true,
    });
    expect(rtl).toMatchObject({ x: 300, align: "end" });
    // Asked for logically, answered logically.
    expect(rtl.placement).toBe("bottom-start");
    expect(
      computePosition(anchor, box, { placement: "end", rtl: true }),
    ).toMatchObject({ side: "left", x: 200 });
  });

  describe("flip", () => {
    it("takes the other side when the preferred one overflows and the other fits", () => {
      const low = rect(400, 720, 100, 40);
      const result = computePosition(low, box, {
        placement: "bottom",
        boundary: window1000,
      });
      expect(result).toMatchObject({ side: "top", flipped: true, y: 620 });
    });

    it("keeps the side that overflows least when neither fits", () => {
      const tall = { width: 200, height: 500 };
      const mid = rect(400, 400, 100, 40);
      // 440 below, 400 above: below overflows by 140, above by 100.
      expect(
        computePosition(mid, tall, {
          placement: "bottom",
          boundary: window1000,
        }).side,
      ).toBe("top");
      // The same room each way stays on the preferred side.
      const even = rect(400, 380, 100, 40);
      expect(
        computePosition(even, tall, {
          placement: "bottom",
          boundary: window1000,
        }).side,
      ).toBe("bottom");
    });

    it("counts the gap in the room a side needs", () => {
      const nearly = rect(400, 650, 100, 40);
      // 110px below fits a 100px box, but not with a 16px gap.
      expect(
        computePosition(nearly, box, {
          placement: "bottom",
          boundary: window1000,
          offset: 16,
        }).side,
      ).toBe("top");
    });

    it("does nothing without a boundary, with flip off, or for a box with no layout", () => {
      const low = rect(400, 760, 100, 40);
      expect(computePosition(low, box, { placement: "bottom" }).side).toBe(
        "bottom",
      );
      expect(
        computePosition(low, box, {
          placement: "bottom",
          boundary: window1000,
          flip: false,
        }).side,
      ).toBe("bottom");
      expect(
        computePosition(
          low,
          { width: 0, height: 0 },
          {
            placement: "bottom",
            boundary: window1000,
            offset: 8,
          },
        ).side,
      ).toBe("bottom");
    });

    it("opens across the page when neither side fits and fallbackAxis is on", () => {
      const narrow = { left: 0, top: 0, right: 300, bottom: 800 };
      const result = computePosition(rect(120, 300, 60, 40), box, {
        placement: "right",
        boundary: narrow,
        flip: { fallbackAxis: true },
        offset: 8,
      });
      expect(result).toMatchObject({ side: "bottom", align: "center" });
      // Below does not fit near the bottom edge, above does.
      const low = computePosition(rect(120, 740, 60, 40), box, {
        placement: "right",
        boundary: narrow,
        flip: { fallbackAxis: true },
        offset: 8,
      });
      expect(low.side).toBe("top");
    });

    it("takes the other edge when the box runs past the boundary along the anchor", () => {
      const edge = rect(900, 300, 80, 40);
      const result = computePosition(edge, box, {
        placement: "bottom-start",
        boundary: window1000,
        flip: { align: true },
      });
      expect(result).toMatchObject({ align: "end", x: 780 });
    });

    it("keeps the side it was given and still fits the alignment", () => {
      const low = rect(900, 760, 80, 40);
      const result = computePosition(low, box, {
        placement: "bottom-start",
        boundary: window1000,
        flip: { side: false, align: true },
      });
      expect(result).toMatchObject({ side: "bottom", align: "end" });
    });

    it("only moves to a side or edge that fits with bestFit off", () => {
      const options = {
        boundary: { left: 0, top: 0, right: 400, bottom: 400 },
        flip: { bestFit: false, align: true },
      };
      // Fits neither above nor below: stays put.
      expect(
        computePosition(
          rect(100, 150, 10, 10),
          { width: 100, height: 300 },
          {
            ...options,
            placement: "bottom",
          },
        ).side,
      ).toBe("bottom");
    });
  });

  describe("shift", () => {
    it("slides the box back inside and reports how far", () => {
      const result = computePosition(rect(950, 300, 40, 40), box, {
        placement: "top",
        boundary: window1000,
        shift: { padding: 8 },
      });
      expect(result.x).toBe(792);
      expect(result.shift).toEqual({ x: -78, y: 0 });
      // The anchor's point is not moved by the slide.
      expect(result.reference.x).toBe(970);
    });

    it("keeps the leading edge of a box wider than the room in view", () => {
      expect(
        computePosition(
          rect(100, 300, 40, 40),
          { width: 600, height: 50 },
          {
            placement: "top",
            boundary: { left: 0, top: 0, right: 400, bottom: 800 },
            shift: { padding: 8 },
          },
        ).x,
      ).toBe(8);
    });

    it("slides across the side only on request", () => {
      const cramped = { left: 0, top: 0, right: 1000, bottom: 150 };
      const options = {
        placement: "bottom-start",
        boundary: cramped,
        flip: false,
      } as const;
      expect(computePosition(rect(0, 100, 40, 40), box, options).y).toBe(140);
      expect(
        computePosition(rect(0, 100, 40, 40), box, {
          ...options,
          shift: { mainAxis: true },
        }).y,
      ).toBe(50);
    });

    it("slides a span into the room", () => {
      expect(slideWithin(950, 100, 8, 992)).toBe(-58);
      expect(slideWithin(-20, 100, 8, 992)).toBe(28);
      expect(slideWithin(100, 100, 8, 992)).toBe(0);
      expect(slideWithin(100, 2000, 8, 992)).toBe(-92);
    });
  });

  it("reports where the arrow goes and how far it sits from the anchor's center", () => {
    const result = computePosition(rect(950, 300, 40, 40), box, {
      placement: "top",
      boundary: window1000,
      shift: { padding: 8 },
      arrow: { size: 16, padding: 8 },
    });
    // The anchor's center is 178px along a box that starts at 792.
    expect(result.arrow).toEqual({ x: 170, offset: 0 });
    // Slid so far that the anchor's center is off the box: the arrow stops
    // at the corner, and says how far short it is.
    const off = computePosition(rect(-100, 300, 40, 40), box, {
      placement: "top",
      boundary: window1000,
      shift: { padding: 8 },
      arrow: { size: 16, padding: 8 },
    });
    expect(off.arrow).toEqual({ x: 8, offset: 104 });
  });

  it("reports the room left on the side it opens on", () => {
    expect(
      computePosition(anchor, box, {
        placement: "bottom",
        boundary: window1000,
        offset: 8,
        size: { padding: 10 },
      }).available,
    ).toEqual({ width: 980, height: 800 - 10 - 340 - 8 });
    expect(
      computePosition(anchor, box, {
        placement: "left",
        boundary: window1000,
        size: true,
        flip: false,
      }).available?.width,
    ).toBe(400);
  });

  it("takes a pointer, a zero-size rect, as the anchor", () => {
    const pointer = rect(300, 200, 0, 0);
    expect(
      computePosition(pointer, box, { placement: "bottom-start" }),
    ).toMatchObject({ x: 300, y: 200 });
  });
});

// The placement rules the menus and popovers carried before the engine.
describe("parity with the rules it replaced", () => {
  /** `fitMenuAxis`: a menu along one viewport axis, from a pointer or an anchor. */
  const axis = (
    before: number,
    after: number,
    size: number,
    max: number,
    reverse = false,
  ) =>
    computePosition(
      {
        left: before,
        right: after,
        width: after - before,
        top: 0,
        bottom: 0,
        height: 0,
      },
      { width: size, height: 1 },
      {
        placement: "end-start",
        rtl: reverse,
        flip: { bestFit: false },
        shift: { mainAxis: true },
        boundary: { left: 0, right: max, top: -1e9, bottom: 1e9 },
      },
    ).x;

  it.each([
    ["opens toward the far end from a pointer", 100, 100, 100],
    ["opens back from a pointer near the far edge", 350, 350, 200],
    ["opens past an anchor's far edge", 50, 200, 200],
    ["opens back from an anchor's near edge", 200, 300, 50],
    ["pins to the far edge when neither side fits", 100, 300, 250],
  ])("a menu %s", (_, before, after, left) => {
    expect(axis(before, after, 150, 400)).toBe(left);
  });

  it.each([
    ["opens back from a pointer", 300, 300, 150],
    ["opens toward the far end from a pointer near the near edge", 50, 50, 50],
    ["opens back from an anchor's near edge", 200, 300, 50],
    ["opens past an anchor's far edge", 100, 200, 200],
    ["pins to the near edge when neither side fits", 100, 300, 0],
  ])("in reverse, a menu %s", (_, before, after, left) => {
    expect(axis(before, after, 150, 400, true)).toBe(left);
  });

  it("fits a menu that exactly fills the space on its side", () => {
    expect(axis(250, 250, 150, 400)).toBe(250);
    expect(axis(150, 150, 150, 400, true)).toBe(0);
  });

  /** `fitIntrinsicAlign`: a menu under an anchor, 8px inside the sides. */
  const align = (
    before: number,
    after: number,
    size: number,
    max: number,
    preferred: "start" | "center" | "end",
  ) =>
    computePosition(
      {
        left: before,
        right: after,
        width: after - before,
        top: 0,
        bottom: 10,
        height: 10,
      },
      { width: size, height: 10 },
      {
        placement: formatPlacement("bottom", preferred),
        flip: { align: "any" },
        padding: { cross: 8 },
        boundary: { left: 0, right: max, top: -1e9, bottom: 1e9 },
      },
    ).align;

  it.each([
    ["keeps start with room", 400, "start", "start"],
    ["keeps end with room", 400, "end", "end"],
    ["keeps center with room", 400, "center", "center"],
    ["takes end at the right edge", 880, "start", "end"],
    ["takes start at the left edge", 20, "end", "start"],
    ["takes start from center at the left edge", 0, "center", "start"],
    ["takes end from center at the right edge", 900, "center", "end"],
  ] as const)("an alignment %s", (_, before, preferred, expected) => {
    expect(align(before, before + 100, 200, 1000, preferred)).toBe(expected);
  });

  it("takes center when only center fits", () => {
    expect(align(110, 210, 300, 320, "start")).toBe("center");
    expect(align(110, 210, 300, 320, "end")).toBe("center");
  });
});
