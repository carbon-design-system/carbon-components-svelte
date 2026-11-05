// @vitest-environment node
import {
  menuSide,
  physicalAlign,
} from "carbon-components-svelte/utils/menu-placement.js";

describe("physicalAlign", () => {
  it.each([
    ["start", false, "start"],
    ["end", false, "end"],
    ["center", false, "center"],
    ["start", true, "end"],
    ["end", true, "start"],
    ["center", true, "center"],
  ] as const)("maps %s (rtl: %s) to %s", (align, rtl, expected) => {
    expect(physicalAlign(align, rtl)).toBe(expected);
  });
});

describe("menuSide", () => {
  // A 400px-tall window.
  beforeEach(() => {
    vi.stubGlobal("document", { documentElement: { clientHeight: 400 } });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const box = (top: number, height: number) =>
    ({
      getBoundingClientRect: () => ({ top, bottom: top + height, height }),
    }) as unknown as Element;
  // A 40px anchor at `top`, and a menu `menuHeight` tall.
  const side = (top: number, menuHeight: number, direction: "top" | "bottom") =>
    menuSide(box(top, 40), box(0, menuHeight), direction);

  it.each([
    ["keeps a menu that fits below", 100, 200, "bottom", "bottom"],
    [
      "flips up when below is short and above has more room",
      300,
      200,
      "bottom",
      "top",
    ],
    ["stays below when above has less room", 150, 250, "bottom", "bottom"],
    ["keeps a menu that fits above", 300, 200, "top", "top"],
    [
      "flips down when above is short and below has more room",
      50,
      200,
      "top",
      "bottom",
    ],
  ] as const)("%s", (_, top, menuHeight, direction, expected) => {
    expect(side(top, menuHeight, direction)).toBe(expected);
  });

  it("keeps `direction` for a menu with no layout", () => {
    expect(side(300, 0, "bottom")).toBe("bottom");
  });

  it("keeps `direction` for an anchor out of the window", () => {
    expect(side(500, 200, "bottom")).toBe("bottom");
    expect(side(-100, 200, "top")).toBe("top");
  });
});
