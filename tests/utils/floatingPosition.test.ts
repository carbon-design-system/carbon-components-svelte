import {
  floatingPosition,
  type RectLike,
} from "../../src/utils/floatingPosition.js";

/** Build a RectLike from x/y/width/height (right/bottom derived). */
function rect(x: number, y: number, width: number, height: number): RectLike {
  return {
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
    width,
    height,
  };
}

const viewport = {
  innerWidth: 1000,
  innerHeight: 800,
  scrollX: 0,
  scrollY: 0,
};

describe("floatingPosition", () => {
  describe("without flip", () => {
    test("places bottom below anchor and matches anchor width", () => {
      const result = floatingPosition({
        anchorRect: rect(100, 200, 150, 40),
        floatingRect: rect(0, 0, 150, 60),
        viewport,
        direction: "bottom",
        gapBottom: 8,
      });

      expect(result.actualDirection).toBe("bottom");
      expect(result.top).toBe(248); // anchor.bottom (240) + gapBottom (8)
      expect(result.left).toBe(100);
      expect(result.width).toBe(150);
    });

    test("places top above anchor using floating height", () => {
      const result = floatingPosition({
        anchorRect: rect(100, 200, 150, 40),
        floatingRect: rect(0, 0, 150, 60),
        viewport,
        direction: "top",
        gapTop: 8,
      });

      expect(result.actualDirection).toBe("top");
      expect(result.top).toBe(132); // anchor.top (200) - floating.height (60) - gapTop (8)
      expect(result.left).toBe(100);
      expect(result.width).toBe(150);
    });

    test("places right of anchor, vertically centered", () => {
      const result = floatingPosition({
        anchorRect: rect(100, 200, 150, 40),
        floatingRect: rect(0, 0, 80, 20),
        viewport,
        direction: "right",
        horizontalGapRight: 5,
      });

      expect(result.actualDirection).toBe("right");
      expect(result.left).toBe(255); // anchor.right (250) + gap (5)
      expect(result.top).toBe(210); // 200 + 40/2 - 20/2
      expect(result.width).toBeUndefined();
    });

    test("places left of anchor, offset by floating width", () => {
      const result = floatingPosition({
        anchorRect: rect(300, 200, 150, 40),
        floatingRect: rect(0, 0, 80, 20),
        viewport,
        direction: "left",
        horizontalGapLeft: 5,
      });

      expect(result.actualDirection).toBe("left");
      expect(result.left).toBe(215); // 300 - 80 - 5
      expect(result.top).toBe(210);
    });
  });

  describe("vertical viewport clamping (left/right direction)", () => {
    test("shifts up when a bottom-anchored right placement would overflow the bottom edge", () => {
      const result = floatingPosition({
        anchorRect: rect(100, 780, 100, 20), // near the bottom of an 800px viewport
        floatingRect: rect(0, 0, 150, 200),
        viewport,
        direction: "right",
      });

      expect(result.actualDirection).toBe("right");
      expect(result.top).toBe(600); // clamped so top + height (200) === innerHeight (800)
    });

    test("does not shift when the content already fits", () => {
      const result = floatingPosition({
        anchorRect: rect(100, 200, 100, 20),
        floatingRect: rect(0, 0, 150, 200),
        viewport,
        direction: "right",
      });

      expect(result.top).toBe(110); // centered: 200 + 20/2 - 200/2
    });

    test("prefers the top viewport edge when content is taller than the viewport", () => {
      const result = floatingPosition({
        anchorRect: rect(100, 400, 100, 20),
        floatingRect: rect(0, 0, 150, 1200),
        viewport,
        direction: "left",
      });

      expect(result.top).toBe(0);
    });

    test("clamps the primary axis too when content fits on neither side", () => {
      const narrowViewport = { ...viewport, innerWidth: 200 };
      const result = floatingPosition({
        anchorRect: rect(50, 100, 100, 20),
        floatingRect: rect(0, 0, 250, 200), // wider than the 200px viewport
        viewport: narrowViewport,
        direction: "right",
      });

      expect(result.left).toBe(0);
    });
  });

  describe("auto-flip", () => {
    test("bottom flips to top when there is more room above", () => {
      const result = floatingPosition({
        anchorRect: rect(100, 750, 150, 40), // bottom at 790, near viewport bottom (800)
        floatingRect: rect(0, 0, 150, 200),
        viewport,
        direction: "bottom",
      });

      expect(result.actualDirection).toBe("top");
    });

    test("top flips to bottom when there is more room below", () => {
      const result = floatingPosition({
        anchorRect: rect(100, 10, 150, 40), // top at 10, little room above
        floatingRect: rect(0, 0, 150, 200),
        viewport,
        direction: "top",
      });

      expect(result.actualDirection).toBe("bottom");
    });

    test("right flips to left when it would overflow the right edge", () => {
      const result = floatingPosition({
        anchorRect: rect(880, 200, 100, 40), // right at 980, near edge (1000)
        floatingRect: rect(0, 0, 200, 40),
        viewport,
        direction: "right",
      });

      expect(result.actualDirection).toBe("left");
    });

    test("left flips to right when it would overflow the left edge", () => {
      const result = floatingPosition({
        anchorRect: rect(20, 200, 100, 40), // left at 20, little room
        floatingRect: rect(0, 0, 200, 40),
        viewport,
        direction: "left",
      });

      expect(result.actualDirection).toBe("right");
    });

    test("does not flip when the preferred direction has enough room", () => {
      const result = floatingPosition({
        anchorRect: rect(100, 200, 150, 40),
        floatingRect: rect(0, 0, 150, 60),
        viewport,
        direction: "bottom",
      });

      expect(result.actualDirection).toBe("bottom");
    });
  });

  describe("lockedDirection", () => {
    test("keeps the locked side even when the preferred side would overflow", () => {
      // Narrow content fits on the right (no flip), but it stays on the locked
      // left side — e.g. a wide tooltip flipped left, then its text shrank.
      const result = floatingPosition({
        anchorRect: rect(880, 200, 100, 40),
        floatingRect: rect(0, 0, 60, 40),
        viewport,
        direction: "right",
        lockedDirection: "left",
      });

      expect(result.actualDirection).toBe("left");
      expect(result.left).toBe(820); // anchor.left (880) - floating width (60)
    });

    test("ignores the preferred direction when locked to the opposite side", () => {
      const result = floatingPosition({
        anchorRect: rect(100, 200, 150, 40),
        floatingRect: rect(0, 0, 150, 60),
        viewport,
        direction: "bottom",
        lockedDirection: "top",
      });

      expect(result.actualDirection).toBe("top");
    });

    test("skips the flip check even when the preferred direction would overflow", () => {
      const result = floatingPosition({
        anchorRect: rect(100, 750, 150, 40), // bottom at 790, near viewport bottom (800): would flip without the lock
        floatingRect: rect(0, 0, 150, 200),
        viewport,
        direction: "bottom",
        lockedDirection: "bottom",
      });

      expect(result.actualDirection).toBe("bottom");
      expect(result.top).toBe(790); // anchor.bottom, not flipped above the anchor
    });
  });

  describe("intrinsic width (vertical)", () => {
    const anchorRect = rect(100, 200, 150, 40); // center x = 175

    test("center intrinsic align uses anchor center, no width", () => {
      const result = floatingPosition({
        anchorRect,
        floatingRect: rect(0, 0, 80, 30),
        viewport,
        direction: "bottom",
        intrinsicWidth: true,
        intrinsicAlign: "center",
      });

      expect(result.left).toBe(175); // anchor.left (100) + width/2 (75)
      expect(result.width).toBeUndefined();
      expect(result.caretNudgePx).toBeUndefined();
    });

    test("start intrinsic align uses anchor left and sets caretNudgePx", () => {
      const result = floatingPosition({
        anchorRect,
        floatingRect: rect(100, 0, 80, 30), // measured left = 100
        viewport,
        direction: "bottom",
        intrinsicWidth: true,
        intrinsicAlign: "start",
      });

      expect(result.left).toBe(100);
      // Half the anchor width (150 / 2), applied from the box's left edge.
      expect(result.caretNudgePx).toBe(75);
    });

    test("end intrinsic align uses anchor right; caret offset is anchor half-width", () => {
      const result = floatingPosition({
        anchorRect, // right = 250
        floatingRect: rect(999, 0, 80, 30), // left and width are ignored for the caret
        viewport,
        direction: "bottom",
        intrinsicWidth: true,
        intrinsicAlign: "end",
      });

      expect(result.left).toBe(250); // anchor.right
      // Half the anchor width (150 / 2), applied from the box's right edge by
      // the CSS, so the caret stays centered on the trigger regardless of the
      // floating width.
      expect(result.caretNudgePx).toBe(75);
    });
  });

  describe("horizontal viewport clamping (intrinsic width, vertical direction)", () => {
    test("shifts left when start-aligned content would overflow the right edge", () => {
      const result = floatingPosition({
        anchorRect: rect(950, 200, 0, 20), // zero-width point anchor near right edge
        floatingRect: rect(0, 0, 200, 150),
        viewport,
        direction: "bottom",
        intrinsicWidth: true,
        intrinsicAlign: "start",
      });

      expect(result.left).toBe(800); // clamped so left + width (200) === innerWidth (1000)
    });

    test("does not shift when the content already fits", () => {
      const result = floatingPosition({
        anchorRect: rect(300, 200, 0, 20),
        floatingRect: rect(0, 0, 200, 150),
        viewport,
        direction: "bottom",
        intrinsicWidth: true,
        intrinsicAlign: "start",
      });

      expect(result.left).toBe(300);
    });

    test("shifts right when the content would overflow the left edge", () => {
      const result = floatingPosition({
        anchorRect: rect(-50, 200, 0, 20),
        floatingRect: rect(0, 0, 200, 150),
        viewport,
        direction: "bottom",
        intrinsicWidth: true,
        intrinsicAlign: "start",
      });

      expect(result.left).toBe(0);
    });

    test("accounts for the CSS translateX(-50%) applied to center-aligned content", () => {
      const result = floatingPosition({
        anchorRect: rect(950, 200, 0, 20), // anchor center = 950
        floatingRect: rect(0, 0, 200, 150),
        viewport,
        direction: "bottom",
        intrinsicWidth: true,
        intrinsicAlign: "center",
      });

      // True left edge after translateX(-50%) is (left - 100); clamp that to
      // maxLeft (800), so the returned anchor-relative left is 800 + 100.
      expect(result.left).toBe(900);
    });

    test("accounts for the CSS translateX(-100%) applied to end-aligned content", () => {
      const result = floatingPosition({
        anchorRect: rect(50, 200, 0, 20), // anchor right edge = 50
        floatingRect: rect(0, 0, 200, 150),
        viewport,
        direction: "bottom",
        intrinsicWidth: true,
        intrinsicAlign: "end",
      });

      // True left edge after translateX(-100%) is (left - 200); clamp that to
      // minLeft (0), so the returned anchor-relative left is 0 + 200.
      expect(result.left).toBe(200);
    });

    test("shifts the caret nudge to keep pointing at the anchor after clamping", () => {
      const result = floatingPosition({
        anchorRect: rect(950, 200, 100, 20), // anchor width 100, center at 1000
        floatingRect: rect(0, 0, 200, 150),
        viewport,
        direction: "bottom",
        intrinsicWidth: true,
        intrinsicAlign: "start",
      });

      // Box shifted left by 150 (950 -> 800) to fit, but the anchor (and its
      // center) didn't move - the caret nudge grows by the same 150 so it
      // still points at the anchor center instead of drifting with the box.
      expect(result.left).toBe(800);
      expect(result.caretNudgePx).toBe(200);
    });

    test("prefers the left viewport edge when content is wider than the viewport", () => {
      const result = floatingPosition({
        anchorRect: rect(500, 200, 0, 20),
        floatingRect: rect(0, 0, 1200, 150),
        viewport,
        direction: "bottom",
        intrinsicWidth: true,
        intrinsicAlign: "start",
      });

      expect(result.left).toBe(0);
    });

    test("clamps using scroll offset when not using fixed position", () => {
      const scrolled = { ...viewport, scrollX: 100 };
      const result = floatingPosition({
        anchorRect: rect(950, 200, 0, 20),
        floatingRect: rect(0, 0, 200, 150),
        viewport: scrolled,
        direction: "bottom",
        intrinsicWidth: true,
        intrinsicAlign: "start",
        useFixedPosition: false,
      });

      // maxLeft = scrollX (100) + innerWidth (1000) - width (200) = 900
      expect(result.left).toBe(900);
    });
  });

  describe("useFixedPosition", () => {
    test("ignores scroll offsets when useFixedPosition is true", () => {
      const scrolled = { ...viewport, scrollX: 50, scrollY: 300 };
      const anchorRect = rect(100, 200, 150, 40);
      const floatingRect = rect(0, 0, 150, 60);

      const fixed = floatingPosition({
        anchorRect,
        floatingRect,
        viewport: scrolled,
        direction: "bottom",
        useFixedPosition: true,
      });
      const absolute = floatingPosition({
        anchorRect,
        floatingRect,
        viewport: scrolled,
        direction: "bottom",
        useFixedPosition: false,
      });

      expect(fixed.top).toBe(240); // no scrollY added
      expect(fixed.left).toBe(100); // no scrollX added
      expect(absolute.top).toBe(540); // 240 + scrollY (300)
      expect(absolute.left).toBe(150); // 100 + scrollX (50)
    });
  });
});
