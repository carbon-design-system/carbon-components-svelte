// @vitest-environment node
import { easing } from "../../src/motion/tokens.js";
import { fade, flip, fly, slide } from "../../src/motion/transitions.js";

type Config = {
  delay?: number;
  duration?: number;
  easing?: (t: number) => number;
  css?: (t: number, u: number) => string;
};

const node = {} as Element;

function stubStyle(style: Record<string, string> = {}) {
  vi.stubGlobal("getComputedStyle", () => ({
    opacity: "1",
    transform: "none",
    transformOrigin: "0px 0px",
    getPropertyValue: (name: string) => style[name] ?? "0",
    ...style,
  }));
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("window", {
    matchMedia: () => ({ matches: reduce }),
  });
}

beforeEach(() => stubStyle());
afterEach(() => vi.unstubAllGlobals());

describe("direction", () => {
  it("in: uses the entrance curve and out: the exit curve", () => {
    const entering = fade(node, {}, { direction: "in" }) as Config;
    const leaving = fade(node, {}, { direction: "out" }) as Config;
    expect(entering.easing?.(0.4)).toBe(easing.entrance.productive(0.4));
    expect(leaving.easing?.(0.4)).toBe(easing.exit.productive(0.4));
  });

  // Svelte 3 and 4 throw on a `transition:` whose config is a function, so a
  // two-way transition cannot choose its curve per run.
  it("transition: takes the standard curve and never a function config", () => {
    for (const options of [{ direction: "both" as const }, undefined]) {
      const config = fade(node, {}, options);
      expect(typeof config).toBe("object");
      expect(config.easing?.(0.4)).toBe(easing.standard.productive(0.4));
    }
  });
});

describe("params", () => {
  it("defaults the duration per transition", () => {
    expect((fade(node, {}, { direction: "in" }) as Config).duration).toBe(110);
    expect((slide(node, {}, { direction: "in" }) as Config).duration).toBe(240);
    expect((fly(node, {}, { direction: "in" }) as Config).duration).toBe(240);
  });

  it("accepts a number or a token name for the duration", () => {
    const options = { direction: "in" } as const;
    expect((fade(node, { duration: 90 }, options) as Config).duration).toBe(90);
    expect(
      (fade(node, { duration: "slow01" }, options) as Config).duration,
    ).toBe(400);
    expect(
      // @ts-expect-error not a token
      (fade(node, { duration: "toString" }, options) as Config).duration,
    ).toBe(110);
  });

  it("picks the expressive curve and honors a named or custom easing", () => {
    const options = { direction: "in" } as const;
    expect(
      (fade(node, { mode: "expressive" }, options) as Config).easing?.(0.4),
    ).toBe(easing.entrance.expressive(0.4));
    expect(
      (fade(node, { easing: "exit" }, options) as Config).easing?.(0.4),
    ).toBe(easing.exit.productive(0.4));
    const custom = (t: number) => t * t;
    expect((fade(node, { easing: custom }, options) as Config).easing).toBe(
      custom,
    );
  });

  it("passes delay through", () => {
    expect(
      (fade(node, { delay: 50 }, { direction: "in" }) as Config).delay,
    ).toBe(50);
  });
});

describe("reduced motion", () => {
  it("returns exactly { duration: 0 }, with no css or delay", () => {
    stubReducedMotion(true);
    for (const direction of ["in", "out", "both"] as const) {
      for (const transition of [fade, slide, fly]) {
        expect(
          transition(node, { delay: 100, duration: 500 }, { direction }),
        ).toEqual({ duration: 0 });
      }
    }
  });

  it("reducedMotion: 'ignore' plays the motion", () => {
    stubReducedMotion(true);
    const config = fade(
      node,
      { reducedMotion: "ignore" },
      { direction: "in" },
    ) as Config;
    expect(config.duration).toBe(110);
    expect(config.css).toBeTypeOf("function");
  });

  it("'respect' plays the motion when the preference is off", () => {
    stubReducedMotion(false);
    expect(
      (fade(node, { reducedMotion: "respect" }, { direction: "in" }) as Config)
        .duration,
    ).toBe(110);
  });

  it("reads the preference each time the transition starts", () => {
    stubReducedMotion(false);
    expect(fade(node, {}, { direction: "out" }).duration).toBe(110);
    stubReducedMotion(true);
    expect(fade(node, {}, { direction: "out" })).toEqual({ duration: 0 });
  });

  it("flip returns { duration: 0 } too", () => {
    stubReducedMotion(true);
    const rect = { left: 0, top: 0, width: 10, height: 10 } as DOMRect;
    expect(flip(node, { from: rect, to: rect })).toEqual({ duration: 0 });
  });
});

describe("css", () => {
  it("fade scales the node's own opacity", () => {
    stubStyle({ opacity: "0.5" });
    const { css } = fade(node, {}, { direction: "in" }) as Config;
    expect(css?.(0.5, 0.5)).toBe("opacity: 0.25");
  });

  it("slide animates size, padding, margin and border width, never border color", () => {
    stubStyle({
      height: "100px",
      "padding-top": "10px",
      "margin-bottom": "4px",
      "border-top-width": "2px",
    });
    const { css } = slide(node, {}, { direction: "in" }) as Config;
    const value = css?.(0.5, 0.5) ?? "";
    expect(value).toContain("overflow: hidden;");
    expect(value).toContain("height: 50px;");
    expect(value).toContain("padding-top: 5px;");
    expect(value).toContain("margin-bottom: 2px;");
    expect(value).toContain("border-top-width: 1px;");
    expect(value).not.toMatch(/color|outline|box-shadow/);
  });

  it("slide on the x axis animates width", () => {
    stubStyle({ width: "200px" });
    const { css } = slide(node, { axis: "x" }, { direction: "in" }) as Config;
    expect(css?.(0.5, 0.5)).toContain("width: 100px;");
    expect(css?.(0.5, 0.5)).not.toContain("height");
  });

  it("slide does not emit NaN for a node with no layout", () => {
    stubStyle({ height: "auto" });
    const { css } = slide(node, {}, { direction: "in" }) as Config;
    expect(css?.(0.5, 0.5)).not.toContain("NaN");
  });

  it("fly offsets from x and y, with units, and collapses on request", () => {
    stubStyle({ height: "40px" });
    const plain = fly(
      node,
      { x: 32, y: "1rem" },
      { direction: "in" },
    ) as Config;
    expect(plain.css?.(0, 1)).toContain("translate(32px, 1rem)");
    expect(plain.css?.(0, 1)).toContain("opacity: 0");
    expect(plain.css?.(0, 1)).not.toContain("height");
    const collapsing = fly(
      node,
      { y: 8, collapse: true },
      { direction: "in" },
    ) as Config;
    expect(collapsing.css?.(0.5, 0.5)).toContain("height: 20px;");
  });

  it("flip moves from the old rect to the new one", () => {
    const from = { left: 0, top: 100, width: 50, height: 20 } as DOMRect;
    const to = { left: 0, top: 0, width: 50, height: 20 } as DOMRect;
    const config = flip(node, { from, to }, { duration: (d) => d * 2 });
    expect(config.duration).toBe(200);
    expect(config.css?.(0, 1)).toContain("translate(0px, 100px)");
    expect(flip(node, { from, to }).duration).toBe(240);
  });
});
