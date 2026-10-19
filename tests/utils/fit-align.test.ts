import { shouldFlipAlign, windowShift } from "../../src/utils/fit-align.js";
import { rect } from "./rect";

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

function box(edges: Parameters<typeof rect>[0]) {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => rect(edges);
  return el;
}

describe("windowShift", () => {
  afterEach(() => vi.restoreAllMocks());

  function windowWidth(width: number) {
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      width,
    );
  }

  it("slides a box past either edge back inside the margin", () => {
    windowWidth(1000);
    expect(windowShift(box({ left: -20, width: 100 }), 0)).toBe(28);
    expect(windowShift(box({ left: 950, width: 100 }), 0)).toBe(-58);
    expect(windowShift(box({ left: 300, width: 100 }), 0)).toBe(0);
  });

  it("keeps the applied slide when there's no layout to measure", () => {
    windowWidth(1000);
    expect(windowShift(box({ left: -20 }), 12)).toBe(12);

    // jsdom: the window itself has no width.
    windowWidth(0);
    expect(windowShift(box({ left: 300, width: 100 }), 12)).toBe(12);
  });
});
