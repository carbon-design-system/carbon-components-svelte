import {
  clippedBy,
  shouldFlipAlign,
  windowShift,
} from "../../src/utils/fit-align.js";
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

describe("clippedBy", () => {
  afterEach(() => document.body.replaceChildren());

  // A box at `edges` whose padding box is the same size: no borders or
  // scrollbars. jsdom doesn't expand the `overflow` shorthand, so styles
  // set each axis.
  function place(
    el: HTMLElement,
    edges: Parameters<typeof rect>[0],
    style: Partial<CSSStyleDeclaration> = {},
  ) {
    const r = rect(edges);
    el.getBoundingClientRect = () => r;
    Object.defineProperty(el, "clientWidth", {
      value: r.width,
      configurable: true,
    });
    Object.defineProperty(el, "clientHeight", {
      value: r.height,
      configurable: true,
    });
    Object.assign(el.style, style);
    return el;
  }

  function tree() {
    const outer = document.createElement("div");
    const inner = document.createElement("div");
    const menu = document.createElement("div");
    inner.append(menu);
    outer.append(inner);
    document.body.append(outer);
    return { outer, inner, menu };
  }

  it("finds the box a menu runs past", () => {
    const { outer, inner, menu } = tree();
    place(
      outer,
      { top: 0, left: 0, width: 400, height: 120 },
      { overflowX: "hidden", overflowY: "hidden" },
    );
    place(inner, { top: 0, left: 0, width: 400, height: 40 });
    place(menu, { top: 40, left: 0, width: 200, height: 160 });
    expect(clippedBy(menu)).toBe(outer);
  });

  it("returns null for a menu that fits, or one with no layout", () => {
    const { outer, menu } = tree();
    place(
      outer,
      { top: 0, left: 0, width: 400, height: 400 },
      { overflowX: "auto", overflowY: "auto" },
    );
    place(menu, { top: 40, left: 0, width: 200, height: 160 });
    expect(clippedBy(menu)).toBe(null);

    place(menu, { top: 300, left: 0, width: 0, height: 0 });
    expect(clippedBy(menu)).toBe(null);
  });

  it("only counts the axis a box clips", () => {
    const { outer, menu } = tree();
    place(
      outer,
      { top: 0, left: 0, width: 400, height: 120 },
      {
        overflowX: "hidden",
        overflowY: "visible",
      },
    );
    place(menu, { top: 40, left: 0, width: 200, height: 160 });
    expect(clippedBy(menu)).toBe(null);
  });

  it("skips boxes a fixed or absolute menu escapes", () => {
    const { outer, inner, menu } = tree();
    place(outer, { top: 0, left: 0, width: 400, height: 400 });
    place(
      inner,
      { top: 0, left: 0, width: 400, height: 40 },
      { overflowX: "hidden", overflowY: "hidden" },
    );
    place(
      menu,
      { top: 40, left: 0, width: 200, height: 160 },
      {
        position: "fixed",
      },
    );
    expect(clippedBy(menu)).toBe(null);

    // Positioned against `outer`, so `inner`'s overflow doesn't reach it.
    menu.style.position = "absolute";
    Object.defineProperty(menu, "offsetParent", { value: outer });
    expect(clippedBy(menu)).toBe(null);

    Object.assign(outer.style, { overflowX: "hidden", overflowY: "hidden" });
    place(menu, { top: 300, left: 0, width: 200, height: 160 });
    expect(clippedBy(menu)).toBe(outer);
  });
});
