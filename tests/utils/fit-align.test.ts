import {
  fitPopoverAlign,
  shouldFlipAlign,
  sidePlacement,
  windowShift,
} from "../../src/utils/fit-align.js";
import { popoverPlacement } from "../../src/utils/inline-align.js";
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

describe("sidePlacement", () => {
  it.each([
    ["bottom", "center", "bottom"],
    ["bottom", "start", "bottom-left"],
    ["bottom", "end", "bottom-right"],
    ["top", "start", "top-left"],
    ["top", "end", "top-right"],
    ["right", "center", "right"],
    ["right", "start", "right-top"],
    ["right", "end", "right-bottom"],
    ["left", "start", "left-top"],
    ["left", "end", "left-bottom"],
  ] as const)("places %s and %s as %s", (side, align, expected) => {
    expect(sidePlacement(side, align)).toBe(expected);
  });

  it("never pairs a side with an edge on its own axis", () => {
    const valid = new Set([
      "top",
      "top-left",
      "top-right",
      "bottom",
      "bottom-left",
      "bottom-right",
      "left",
      "left-top",
      "left-bottom",
      "right",
      "right-top",
      "right-bottom",
    ]);
    for (const side of ["top", "bottom", "left", "right"] as const) {
      for (const align of ["start", "center", "end"] as const) {
        expect(valid.has(sidePlacement(side, align))).toBe(true);
      }
    }
  });
});

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

describe("fitPopoverAlign", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  // A 1000 x 600 window with a 40 x 20 anchor at `anchorAt`, and an open
  // popover at `popover`.
  function setup(
    anchorAt: { left: number; top: number },
    popover: Parameters<typeof rect>[0],
  ) {
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      1000,
    );
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(
      600,
    );
    const anchor = document.createElement("div");
    const el = document.createElement("div");
    anchor.append(el);
    document.body.append(anchor);
    anchor.getBoundingClientRect = () =>
      rect({ ...anchorAt, width: 40, height: 20 });
    el.getBoundingClientRect = () => rect(popover);
    return { anchor, el };
  }

  it("keeps a placement that fits", () => {
    const { el, anchor } = setup(
      { left: 100, top: 100 },
      { left: 100, top: 120, width: 300, height: 100 },
    );
    expect(fitPopoverAlign(el, anchor, "bottom-left")).toBe("bottom-left");
  });

  it("takes the other edge at the window's right edge", () => {
    // Start-aligned at 900, it runs to 1200; end-aligned, 640 to 940.
    const { el, anchor } = setup(
      { left: 900, top: 100 },
      { left: 900, top: 120, width: 300, height: 100 },
    );
    expect(fitPopoverAlign(el, anchor, "bottom-left")).toBe("bottom-right");
  });

  it("moves a centered popover to the edge with room", () => {
    const { el, anchor } = setup(
      { left: 10, top: 100 },
      { left: -120, top: 120, width: 300, height: 100 },
    );
    expect(fitPopoverAlign(el, anchor, "bottom")).toBe("bottom-left");
  });

  it("opens above at the bottom of the window", () => {
    const { el, anchor } = setup(
      { left: 100, top: 560 },
      { left: 100, top: 580, width: 300, height: 100 },
    );
    expect(fitPopoverAlign(el, anchor, "bottom-left")).toBe("top-left");
  });

  it("takes the other side beside the anchor, and the other edge", () => {
    // Right of an anchor near the window's right and bottom edges.
    const { el, anchor } = setup(
      { left: 900, top: 560 },
      { left: 940, top: 560, width: 200, height: 100 },
    );
    expect(fitPopoverAlign(el, anchor, "right-top")).toBe("left-bottom");
  });

  // A 600px popover 8px right of a centered anchor needs 608px; each side
  // has 480px.
  it.each([
    ["below", 100, "bottom"],
    ["above, at the bottom of the window", 560, "top"],
  ] as const)("opens %s when neither side has room", (_, top, expected) => {
    const { el, anchor } = setup(
      { left: 480, top },
      { left: 528, top, width: 600, height: 20 },
    );
    expect(fitPopoverAlign(el, anchor, "right")).toBe(expected);
  });

  it("aligns the move below to the edge with room", () => {
    // Centered under the anchor at 120, a 900px popover would start at -330.
    const { el, anchor } = setup(
      { left: 100, top: 100 },
      { left: 92 - 900, top: 100, width: 900, height: 20 },
    );
    expect(fitPopoverAlign(el, anchor, "left-top")).toBe("bottom-left");
  });

  it("fits within the box that clips it across the page", () => {
    // The box ends at 500; the window has room.
    const { el, anchor } = setup(
      { left: 400, top: 100 },
      { left: 400, top: 120, width: 300, height: 100 },
    );
    const box = document.createElement("div");
    box.style.overflowX = "auto";
    box.append(anchor);
    document.body.append(box);
    box.getBoundingClientRect = () => rect({ width: 500, height: 400 });
    Object.defineProperty(box, "clientWidth", { value: 500 });
    expect(fitPopoverAlign(el, anchor, "bottom-left")).toBe("bottom-right");
  });

  it("keeps the placement with no layout, or an anchor out of view", () => {
    const hidden = setup({ left: 900, top: 100 }, { left: 900, top: 120 });
    expect(fitPopoverAlign(hidden.el, hidden.anchor, "bottom-left")).toBe(
      "bottom-left",
    );
    const away = setup(
      { left: 900, top: 700 },
      { left: 900, top: 720, width: 300, height: 100 },
    );
    expect(fitPopoverAlign(away.el, away.anchor, "bottom-left")).toBe(
      "bottom-left",
    );
  });

  // Popover passes the physical placement of its `align`, so in RTL a
  // `bottom-start` popover fits from `bottom-right`.
  it.each([
    [false, 900, "bottom-right"],
    [true, 900, "bottom-right"],
    [false, 10, "bottom-left"],
    [true, 10, "bottom-left"],
  ] as const)(
    "fits bottom-start in %s RTL at %spx to %s",
    (rtl, left, expected) => {
      const placement = popoverPlacement("bottom-start", rtl);
      // Start-aligned (left edge on the anchor's left) or end-aligned.
      const start = placement === "bottom-left" ? left : left + 40 - 300;
      const { el, anchor } = setup(
        { left, top: 100 },
        { left: start, top: 120, width: 300, height: 100 },
      );
      expect(fitPopoverAlign(el, anchor, placement)).toBe(expected);
    },
  );
});
