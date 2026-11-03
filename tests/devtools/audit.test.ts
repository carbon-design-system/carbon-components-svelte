import { audit, carbonOwned, cssPath } from "../../src/devtools/audit.js";
import { targetConflicts } from "../../src/devtools/geometry.js";
import { nearestSpacing } from "../../src/devtools/spacing.js";

function mount(html: string) {
  document.body.innerHTML = html;
  return (selector: string) => document.querySelector(selector) as Element;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("carbonOwned", () => {
  test("is true for an element with a bx-- class", () => {
    const $ = mount(`<button class="bx--btn">Go</button>`);
    expect(carbonOwned($("button"))).toBe(true);
  });

  test("walks up through bare elements to the nearest styled one", () => {
    const $ = mount(
      `<table class="bx--data-table"><tbody><tr><td><span>x</span></td></tr></tbody></table>`,
    );
    expect(carbonOwned($("td"))).toBe(true);
    expect(carbonOwned($("span"))).toBe(true);
  });

  test("is false for the app's classes and inline styles", () => {
    const $ = mount(
      `<div class="bx--col"><p class="svelte-abc">a</p><span style="color: red">b</span></div>`,
    );
    expect(carbonOwned($("p"))).toBe(false);
    expect(carbonOwned($("span"))).toBe(false);
  });

  test("is false at the page root", () => {
    const $ = mount("<p>a</p>");
    expect(carbonOwned($("p"))).toBe(false);
  });

  test("shares answers through a cache", () => {
    const $ = mount(`<ul class="bx--list"><li><a>1</a></li></ul>`);
    const cache = new Map<Element, boolean>();
    expect(carbonOwned($("a"), cache)).toBe(true);
    expect(cache.get($("li"))).toBe(true);
  });
});

describe("cssPath", () => {
  test("stops at a stable id or a test id", () => {
    const $ = mount(
      `<main id="app"><section data-testid="card"><p class="note">x</p></section></main>`,
    );
    expect(cssPath($("p"))).toBe(`[data-testid="card"] > p.note`);
    expect(cssPath($("section"))).toBe(`[data-testid="card"]`);
  });

  test("skips generated ids, alone or after a prefix", () => {
    const $ = mount(
      `<div id="combo-ccs-ab12cd34"><input id="ccs-zz99yy88" class="bx--text-input" /></div>`,
    );
    expect(cssPath($("input"))).toBe("div > input.bx--text-input");
  });

  test("skips Svelte's scoped classes", () => {
    const $ = mount(`<div class="svelte-1x2y card"><b>x</b></div>`);
    expect(cssPath($("b"))).toBe("div.card > b");
  });
});

describe("nearestSpacing", () => {
  test("suggests the closest token", () => {
    expect(nearestSpacing(13)).toEqual({ token: "spacing-04", px: 12 });
    expect(nearestSpacing(15)).toEqual({ token: "spacing-05", px: 16 });
    expect(nearestSpacing(-20)).toEqual({ token: "spacing-05", px: -16 });
  });

  test("follows the root font size", () => {
    expect(nearestSpacing(19, 20)).toEqual({ token: "spacing-05", px: 20 });
  });
});

describe("targetConflicts", () => {
  const box = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    width,
    height,
  });

  test("names the target that crowds most and the room it needs", () => {
    // Centers 20px apart: the circles need 24, so 4px more.
    expect(
      targetConflicts([box(0, 0, 16, 16), box(20, 0, 16, 16)], 24),
    ).toEqual([
      { index: 0, by: 1, needs: 4 },
      { index: 1, by: 0, needs: 4 },
    ]);
  });

  test("passes spaced targets", () => {
    expect(
      targetConflicts([box(0, 0, 16, 16), box(100, 0, 16, 16)], 24),
    ).toEqual([]);
  });
});

describe("animations", () => {
  type FakeAnimation = {
    effect: {
      target: Element;
      getKeyframes: () => Record<string, unknown>[];
      getComputedTiming: () => { duration: number; iterations: number };
    };
    playState: string;
  };

  function animating(
    el: Element,
    options: {
      duration?: number;
      iterations?: number;
      keyframes?: Record<string, unknown>[];
      playState?: string;
    } = {},
  ): FakeAnimation {
    const {
      duration = 240,
      iterations = 1,
      keyframes = [{ opacity: 0 }, { opacity: 1 }],
      playState = "running",
    } = options;
    return {
      effect: {
        target: el,
        getKeyframes: () => keyframes,
        getComputedTiming: () => ({ duration, iterations }),
      },
      playState,
    };
  }

  function stub(animations: FakeAnimation[], reduce = false) {
    vi.stubGlobal("matchMedia", (media: string) => ({
      matches: reduce && media.includes("reduce"),
      media,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    Object.defineProperty(document, "getAnimations", {
      configurable: true,
      value: () => animations,
    });
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(document, "getAnimations", {
      configurable: true,
      value: undefined,
    });
  });

  const run = () =>
    audit({ checks: ["animations"], carbon: true }).findings.map((f) => ({
      severity: f.severity,
      message: f.message.replace(/^[^:]+: /, ""),
    }));

  test("reports nothing when the page has no animations API", () => {
    mount(`<div class="app">x</div>`);
    expect(audit({ checks: ["animations"] }).findings).toEqual([]);
  });

  test("passes a token duration on opacity", () => {
    const $ = mount(`<div class="app">x</div>`);
    stub([animating($(".app"), { duration: 240 })]);
    expect(run()).toEqual([]);
  });

  test("flags a duration that is not a motion token, with the nearest", () => {
    const $ = mount(`<div class="app">x</div>`);
    stub([animating($(".app"), { duration: 300 })]);
    expect(run()).toEqual([
      {
        severity: "warning",
        message: "300ms is not a motion token; nearest is moderate02 (240ms)",
      },
    ]);
  });

  test("Carbon's own animations are info unless carbon is requested", () => {
    const $ = mount(`<div class="bx--tile">x</div>`);
    stub([animating($(".bx--tile"), { duration: 300 })]);
    expect(run()[0]?.severity).toBe("info");
    expect(audit({ checks: ["animations"] }).findings).toEqual([]);
  });

  test("flags a loop outside a loading state", () => {
    const $ = mount(`<div class="app">x</div>`);
    stub([
      animating($(".app"), {
        duration: 700,
        iterations: Number.POSITIVE_INFINITY,
      }),
    ]);
    expect(run().map((f) => f.message)).toEqual([
      "loops; a cue that is not a loading state stops within 5s",
    ]);
  });

  test("lets loading and skeleton states loop and run under reduced motion", () => {
    const $ = mount(
      `<div class="bx--loading"><svg></svg></div><p class="bx--skeleton__text">x</p>`,
    );
    stub(
      [
        animating($("svg"), {
          duration: 690,
          iterations: Number.POSITIVE_INFINITY,
        }),
        animating($("p"), {
          duration: 3000,
          iterations: Number.POSITIVE_INFINITY,
        }),
      ],
      true,
    );
    expect(run()).toEqual([]);
  });

  test("errors on anything else that moves under reduced motion", () => {
    const $ = mount(`<div class="app">x</div>`);
    stub([animating($(".app"), { duration: 240 })], true);
    expect(run()).toEqual([
      {
        severity: "error",
        message: "animates under prefers-reduced-motion: reduce",
      },
    ]);
  });

  test("flags keyframes on layout properties", () => {
    const $ = mount(`<div class="app">x</div>`);
    stub([
      animating($(".app"), {
        keyframes: [
          { height: "0px", paddingTop: "0px" },
          { height: "40px", paddingTop: "8px" },
        ],
      }),
    ]);
    expect(run().map((f) => f.message)).toEqual([
      "animates height, paddingTop, which lays out every frame; animate transform or opacity, or size only on the one element that expands",
    ]);
  });
});
