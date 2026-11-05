import {
  clippedBy,
  clippingBoundary,
  fixedBlockOffset,
  hasFixedBlock,
  portalRoot,
} from "../../src/utils/portal-decision.js";
import { rect } from "./rect";

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

  // jsdom has no `contain` or `content-visibility`, so the computed style
  // reports them for the box that holds them.
  it.each([
    ["contain: paint", { contain: "paint" }],
    ["contain: content", { contain: "content" }],
    ["contain: strict", { contain: "strict" }],
    ["contain: layout paint", { contain: "layout paint" }],
    ["content-visibility: auto", { contentVisibility: "auto" }],
    ["content-visibility: hidden", { contentVisibility: "hidden" }],
  ])("counts %s as clipping, as overflow: hidden does", (_, extraStyle) => {
    const { outer, menu } = tree();
    place(outer, { top: 0, left: 0, width: 400, height: 120 });
    place(menu, { top: 40, left: 0, width: 200, height: 160 });
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
      const style = real(el);
      return el === outer
        ? ({
            ...style,
            overflowX: "visible",
            overflowY: "visible",
            contain: "none",
            contentVisibility: "visible",
            ...extraStyle,
            position: style.position,
          } as CSSStyleDeclaration)
        : style;
    });
    expect(clippedBy(menu)).toBe(outer);
    vi.restoreAllMocks();
  });

  it("does not count layout containment alone", () => {
    const { outer, menu } = tree();
    place(outer, { top: 0, left: 0, width: 400, height: 120 });
    place(menu, { top: 40, left: 0, width: 200, height: 160 });
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((el) =>
      el === outer
        ? ({
            ...real(el),
            overflowX: "visible",
            overflowY: "visible",
            contain: "layout",
            contentVisibility: "visible",
          } as CSSStyleDeclaration)
        : real(el),
    );
    expect(clippedBy(menu)).toBe(null);
    vi.restoreAllMocks();
  });
});

describe("portalRoot", () => {
  afterEach(() => document.body.replaceChildren());

  it("finds the nearest dialog or popover around the anchor", () => {
    document.body.innerHTML =
      '<dialog id="d"><div id="p" popover><button id="b"></button></div></dialog>';
    expect(portalRoot(document.getElementById("b"))).toBe(
      document.getElementById("p"),
    );
    document.body.innerHTML =
      '<dialog id="d"><button id="b"></button></dialog>';
    expect(portalRoot(document.getElementById("b"))).toBe(
      document.getElementById("d"),
    );
  });

  it("is null in the page, so the portal goes to <body>", () => {
    document.body.innerHTML = '<div><button id="b"></button></div>';
    expect(portalRoot(document.getElementById("b"))).toBe(null);
    expect(portalRoot(null)).toBe(null);
  });

  it("finds the fullscreen element, but never the page's root or <body>", () => {
    document.body.innerHTML = '<div id="f"><button id="b"></button></div>';
    const anchor = document.getElementById("b") as HTMLElement;
    const real = anchor.closest.bind(anchor);
    // jsdom has no `:fullscreen`, so the selector is answered for it.
    let fullscreen: Element | null = document.getElementById("f");
    vi.spyOn(anchor, "closest").mockImplementation((selector: string) =>
      selector.includes(":fullscreen") ? fullscreen : real(selector),
    );
    expect(portalRoot(anchor)).toBe(document.getElementById("f"));
    fullscreen = document.body;
    expect(portalRoot(anchor)).toBe(null);
    fullscreen = document.documentElement;
    expect(portalRoot(anchor)).toBe(null);
    vi.restoreAllMocks();
  });

  it("still finds a dialog where `:fullscreen` is not a selector", () => {
    document.body.innerHTML =
      '<dialog id="d"><button id="b"></button></dialog>';
    const anchor = document.getElementById("b") as HTMLElement;
    const real = anchor.closest.bind(anchor);
    vi.spyOn(anchor, "closest").mockImplementation((selector: string) => {
      if (selector.includes(":fullscreen")) throw new SyntaxError("bad");
      return real(selector);
    });
    expect(portalRoot(anchor)).toBe(document.getElementById("d"));
    vi.restoreAllMocks();
  });
});

describe("clippingBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("is the window, or the nearest box that clips the axis within it", () => {
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      1000,
    );
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(
      800,
    );
    document.body.innerHTML = '<div id="box"><span id="el"></span></div>';
    const box = document.getElementById("box") as HTMLElement;
    const el = document.getElementById("el") as HTMLElement;
    expect(clippingBoundary(el)).toEqual({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 800,
    });

    Object.assign(box.style, { overflowX: "auto", overflowY: "visible" });
    box.getBoundingClientRect = () =>
      rect({ left: 100, top: 50, width: 300, height: 200 });
    Object.defineProperty(box, "clientWidth", { value: 300 });
    Object.defineProperty(box, "clientHeight", { value: 200 });
    expect(clippingBoundary(el, "x")).toMatchObject({ left: 100, right: 400 });
    // The box doesn't clip the block axis, so a block-axis fit ignores it.
    expect(clippingBoundary(el, "y")).toMatchObject({ top: 0, bottom: 800 });
    expect(clippingBoundary(el)).toMatchObject({
      left: 100,
      right: 400,
      top: 0,
      bottom: 800,
    });
  });
});

describe("fixed containing blocks", () => {
  afterEach(() => document.body.replaceChildren());

  it("finds a transformed or contained ancestor, but not a plain one", () => {
    document.body.innerHTML =
      '<div id="a"><div id="b"><i id="el"></i></div></div>';
    const el = document.getElementById("el") as HTMLElement;
    expect(hasFixedBlock(el)).toBe(false);
    (document.getElementById("a") as HTMLElement).style.transform =
      "translateX(10px)";
    expect(hasFixedBlock(el)).toBe(true);
    (document.getElementById("a") as HTMLElement).style.transform = "none";
    (document.getElementById("b") as HTMLElement).style.filter = "blur(1px)";
    expect(hasFixedBlock(el)).toBe(true);
  });

  it("measures where a fixed box lands, and puts its styles back", () => {
    document.body.innerHTML = '<div id="a"><i id="el"></i></div>';
    const el = document.getElementById("el") as HTMLElement;
    el.style.left = "5px";
    el.style.top = "6px";
    el.style.transform = "translateX(-50%)";
    // A containing block at (30, 40) puts the box 30 and 40 further on.
    el.getBoundingClientRect = () =>
      rect({
        left: Number.parseFloat(el.style.left) + 30,
        top: Number.parseFloat(el.style.top) + 40,
        width: 10,
        height: 10,
      });
    expect(fixedBlockOffset(el, 100, 200)).toEqual({ x: 30, y: 40 });
    expect(el.style.left).toBe("5px");
    expect(el.style.top).toBe("6px");
    expect(el.style.transform).toBe("translateX(-50%)");
  });
});
