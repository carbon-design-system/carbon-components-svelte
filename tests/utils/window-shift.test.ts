import { windowShift } from "../../src/utils/window-shift.js";
import { rect } from "./rect";

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
