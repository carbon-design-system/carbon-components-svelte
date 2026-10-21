import { shouldFlipAlign } from "../../src/utils/fit-align.js";

describe("shouldFlipAlign", () => {
  const bounds = { left: 0, right: 400 };

  it("keeps a popover that fits", () => {
    expect(shouldFlipAlign({ left: 100, right: 380 }, 120, bounds)).toBe(false);
  });

  it("flips a start-aligned popover that runs past the right edge", () => {
    // Trigger centered at 360: the mirrored popover spans 40 to 380.
    expect(shouldFlipAlign({ left: 340, right: 680 }, 360, bounds)).toBe(true);
  });

  it("flips an end-aligned popover that runs past the left edge", () => {
    expect(shouldFlipAlign({ left: -300, right: 60 }, 40, bounds)).toBe(true);
  });

  it("stays when the other side overflows as much or more", () => {
    // A popover wider than the bounds, on a trigger near the middle.
    expect(shouldFlipAlign({ left: 180, right: 620 }, 200, bounds)).toBe(false);
  });
});
