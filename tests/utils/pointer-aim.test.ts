// @vitest-environment node
import { isAimingAt } from "../../src/utils/pointer-aim.js";

// A submenu 200px wide and 256px tall, opening on the right of x = 300.
const right = { left: 300, right: 500, top: 100, bottom: 356 };
// The same submenu opening on the left of x = 100.
const left = { left: -100, right: 100, top: 100, bottom: 356 };

describe("isAimingAt", () => {
  it("is true for a diagonal move toward a submenu on the right", () => {
    expect(isAimingAt({ x: 220, y: 160 }, { x: 200, y: 140 }, right)).toBe(
      true,
    );
  });

  it("is true for a diagonal move toward a submenu on the left", () => {
    expect(isAimingAt({ x: 180, y: 160 }, { x: 200, y: 140 }, left)).toBe(true);
  });

  it("is false for a move away from the submenu", () => {
    expect(isAimingAt({ x: 180, y: 160 }, { x: 200, y: 140 }, right)).toBe(
      false,
    );
    expect(isAimingAt({ x: 220, y: 160 }, { x: 200, y: 140 }, left)).toBe(
      false,
    );
  });

  it("is false for a move straight down along the menu", () => {
    expect(isAimingAt({ x: 200, y: 180 }, { x: 200, y: 140 }, right)).toBe(
      false,
    );
  });

  it("is false for a move that passes below the submenu", () => {
    // Heads for (300, 440), past the bottom corner at (300, 356).
    expect(isAimingAt({ x: 210, y: 170 }, { x: 200, y: 140 }, right)).toBe(
      false,
    );
  });

  it("counts a move up toward the submenu's top corner", () => {
    expect(isAimingAt({ x: 250, y: 130 }, { x: 200, y: 140 }, right)).toBe(
      true,
    );
  });

  it("widens the near edge by the tolerance", () => {
    // Heads for (300, 98): 2px above the top corner.
    const point = { x: 250, y: 119 };
    const from = { x: 200, y: 140 };
    expect(isAimingAt(point, from, right, 0)).toBe(false);
    expect(isAimingAt(point, from, right, 4)).toBe(true);
  });

  it("counts a point on a side of the triangle", () => {
    // On the line from `from` to the top corner (300, 96).
    expect(isAimingAt({ x: 250, y: 118 }, { x: 200, y: 140 }, right)).toBe(
      true,
    );
  });

  it("is false when the pointer did not move", () => {
    expect(isAimingAt({ x: 200, y: 140 }, { x: 200, y: 140 }, right)).toBe(
      false,
    );
  });

  it("is false for a zero-height rect", () => {
    const flat = { left: 300, right: 500, top: 100, bottom: 100 };
    expect(isAimingAt({ x: 220, y: 100 }, { x: 200, y: 100 }, flat)).toBe(
      false,
    );
  });

  it("is false for a zero-size rect", () => {
    const empty = { left: 0, right: 0, top: 0, bottom: 0 };
    expect(isAimingAt({ x: 20, y: 20 }, { x: 40, y: 40 }, empty)).toBe(false);
  });

  it("is false when the pointer starts within the rect's horizontal span", () => {
    // A submenu pinned over its trigger at the viewport edge has no near edge.
    expect(isAimingAt({ x: 320, y: 60 }, { x: 310, y: 50 }, right)).toBe(false);
  });

  // #2221 measured from the trigger's edge, which equals the submenu's
  // edge when the two sit flush, so its triangle had no area and every
  // check divided by zero. Here `from` is the pointer, and a pointer on the
  // shared edge still gives a defined answer.
  describe("flush with the trigger", () => {
    it("is true for a move from the shared edge into the submenu", () => {
      expect(isAimingAt({ x: 304, y: 160 }, { x: 300, y: 150 }, right)).toBe(
        true,
      );
      expect(isAimingAt({ x: 96, y: 160 }, { x: 100, y: 150 }, left)).toBe(
        true,
      );
    });

    it("is false for a move from the shared edge back into the menu", () => {
      expect(isAimingAt({ x: 296, y: 160 }, { x: 300, y: 150 }, right)).toBe(
        false,
      );
    });

    it("is false for a move from the shared edge past the submenu's end", () => {
      expect(isAimingAt({ x: 304, y: 400 }, { x: 300, y: 350 }, right)).toBe(
        false,
      );
    });

    it("gives a defined answer for a pointer just off the edge", () => {
      const from = { x: 299.999, y: 150 };
      expect(isAimingAt({ x: 300.5, y: 150.2 }, from, right)).toBe(true);
      expect(isAimingAt({ x: 299.5, y: 150.2 }, from, right)).toBe(false);
    });
  });

  describe("right to left", () => {
    // Under dir="rtl" the submenu opens toward the inline end, the left.
    // The geometry only depends on which edge faces the pointer.
    it("aims at a submenu on the left from the trigger's left edge", () => {
      const from = { x: 140, y: 120 };
      expect(isAimingAt({ x: 120, y: 160 }, from, left)).toBe(true);
      expect(isAimingAt({ x: 160, y: 160 }, from, left)).toBe(false);
    });

    it("aims at a submenu flipped to the right near the viewport's left edge", () => {
      const from = { x: 260, y: 120 };
      expect(isAimingAt({ x: 280, y: 160 }, from, right)).toBe(true);
      expect(isAimingAt({ x: 240, y: 160 }, from, right)).toBe(false);
    });
  });
});
