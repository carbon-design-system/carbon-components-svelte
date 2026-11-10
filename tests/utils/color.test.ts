// @vitest-environment node
import {
  colorContrast,
  describeColor,
  describeHue,
  formatColor,
  hslaToHsva,
  hsvaToHsla,
  hsvaToRgba,
  parseColor,
  readableOn,
  rgbaToHsva,
  sameColor,
} from "../../src/utils/color.js";

describe("parseColor", () => {
  it.each([
    ["#0f62fe", { r: 15, g: 98, b: 254, a: 1 }],
    ["#0F62FE", { r: 15, g: 98, b: 254, a: 1 }],
    ["#fff", { r: 255, g: 255, b: 255, a: 1 }],
    ["#f008", { r: 255, g: 0, b: 0, a: 136 / 255 }],
    ["#0f62fe80", { r: 15, g: 98, b: 254, a: 128 / 255 }],
    ["rgb(15, 98, 254)", { r: 15, g: 98, b: 254, a: 1 }],
    ["rgb(15 98 254 / 50%)", { r: 15, g: 98, b: 254, a: 0.5 }],
    ["rgba(15, 98, 254, 0.25)", { r: 15, g: 98, b: 254, a: 0.25 }],
    ["rgb(100%, 0%, 0%)", { r: 255, g: 0, b: 0, a: 1 }],
    ["hsl(0, 100%, 50%)", { r: 255, g: 0, b: 0, a: 1 }],
    ["hsl(120deg 100% 25% / 0.5)", { r: 0, g: 127.5, b: 0, a: 0.5 }],
    ["hsl(0.5turn, 100%, 50%)", { r: 0, g: 255, b: 255, a: 1 }],
    ["transparent", { r: 0, g: 0, b: 0, a: 0 }],
  ])("parses %s", (color, expected) => {
    const rgba = parseColor(color);
    expect(rgba).not.toBeNull();
    for (const key of ["r", "g", "b", "a"] as const) {
      expect(rgba?.[key]).toBeCloseTo(expected[key], 5);
    }
  });

  it.each([
    "",
    "red",
    "#12",
    "#12345",
    "rgb(1, 2)",
    "rgb(1, 2, three)",
    "hsl(10, 50%, 50%, 0.5, 1)",
    "oklch(60% 0.2 250)",
    "var(--cds-background)",
  ])("returns null for %j", (color) => {
    expect(parseColor(color)).toBeNull();
  });

  it("clamps channels and alpha", () => {
    expect(parseColor("rgb(300, -5, 10 / 2)")).toEqual({
      r: 255,
      g: 0,
      b: 10,
      a: 1,
    });
  });
});

describe("HSV, RGB and HSL", () => {
  it.each(["#0f62fe", "#24a148", "#da1e28", "#ffffff", "#000000", "#8d8d8d"])(
    "round-trips %s through HSV",
    (hex) => {
      const rgba = parseColor(hex);
      expect(rgba).not.toBeNull();
      if (!rgba) return;
      expect(sameColor(hsvaToRgba(rgbaToHsva(rgba)), rgba)).toBe(true);
    },
  );

  it("keeps the given hue for a gray", () => {
    expect(rgbaToHsva({ r: 0, g: 0, b: 0, a: 1 }, 210).h).toBe(210);
    expect(rgbaToHsva({ r: 128, g: 128, b: 128, a: 1 }, 40).h).toBe(40);
  });

  it("converts HSV to HSL and back", () => {
    const hsva = { h: 210, s: 80, v: 60, a: 1 };
    const back = hslaToHsva(hsvaToHsla(hsva));
    expect(back.s).toBeCloseTo(hsva.s, 6);
    expect(back.v).toBeCloseTo(hsva.v, 6);
    expect(hsvaToHsla({ h: 0, s: 100, v: 100, a: 1 })).toEqual({
      h: 0,
      s: 100,
      l: 50,
      a: 1,
    });
  });
});

describe("formatColor", () => {
  const blue = { h: 217, s: 94, v: 100, a: 1 };
  const red = { h: 0, s: 100, v: 100, a: 1 };

  it("formats opaque colors", () => {
    expect(formatColor(red, "hex")).toBe("#ff0000");
    expect(formatColor(red, "rgb")).toBe("rgb(255, 0, 0)");
    expect(formatColor(red, "hsl")).toBe("hsl(0, 100%, 50%)");
  });

  it("adds alpha when the color is translucent", () => {
    const half = { ...blue, a: 0.5 };
    expect(formatColor(half, "hex")).toMatch(/^#[0-9a-f]{6}80$/);
    expect(formatColor(half, "rgb")).toMatch(/^rgba\(\d+, \d+, \d+, 0\.5\)$/);
    expect(formatColor(half, "hsl")).toMatch(/^hsla\(\d+, \d+%, \d+%, 0\.5\)$/);
  });

  it("keeps the hue of a gray in HSL", () => {
    expect(formatColor({ h: 210, s: 0, v: 50, a: 1 }, "hsl")).toBe(
      "hsl(210, 0%, 50%)",
    );
  });

  it("parses what it formats", () => {
    const expected = hsvaToRgba(blue);
    for (const format of ["hex", "rgb", "hsl"] as const) {
      const rgba = parseColor(formatColor(blue, format));
      expect(rgba).not.toBeNull();
      if (!rgba) return;
      expect(Math.abs(rgba.r - expected.r)).toBeLessThan(3);
      expect(Math.abs(rgba.g - expected.g)).toBeLessThan(3);
      expect(Math.abs(rgba.b - expected.b)).toBeLessThan(3);
    }
  });
});

describe("colorContrast", () => {
  const black = { r: 0, g: 0, b: 0, a: 1 };
  const white = { r: 255, g: 255, b: 255, a: 1 };

  it("is 21 for black on white and 1 for a color on itself", () => {
    expect(colorContrast(black, white)).toBeCloseTo(21, 5);
    expect(colorContrast(white, white)).toBe(1);
  });

  it("lays a translucent foreground over the background", () => {
    const gray = { r: 127.5, g: 127.5, b: 127.5, a: 1 };
    expect(colorContrast({ ...black, a: 0.5 }, white)).toBeCloseTo(
      colorContrast(gray, white),
      5,
    );
  });

  it("lays a translucent background over white", () => {
    expect(colorContrast(black, { ...black, a: 0 })).toBeCloseTo(21, 5);
  });
});

describe("readableOn", () => {
  it("picks the mark that contrasts", () => {
    expect(readableOn({ r: 255, g: 255, b: 0, a: 1 })).toBe("black");
    expect(readableOn({ r: 15, g: 98, b: 254, a: 1 })).toBe("white");
    expect(readableOn({ r: 0, g: 0, b: 0, a: 0.1 })).toBe("black");
  });
});

describe("describeColor", () => {
  it.each([
    [{ h: 0, s: 100, v: 100, a: 1 }, "red"],
    [{ h: 180, s: 100, v: 50, a: 1 }, "dark teal"],
    [{ h: 217, s: 94, v: 100, a: 1 }, "blue"],
    [{ h: 30, s: 100, v: 70, a: 1 }, "brown"],
    [{ h: 30, s: 100, v: 50, a: 1 }, "dark brown"],
    [{ h: 210, s: 0, v: 100, a: 1 }, "white"],
    [{ h: 210, s: 0, v: 0, a: 1 }, "black"],
    [{ h: 210, s: 0, v: 50, a: 1 }, "gray"],
    [{ h: 210, s: 15, v: 80, a: 1 }, "light grayish blue"],
  ])("names %j %s", (hsva, name) => {
    expect(describeColor(hsva)).toBe(name);
  });

  it("names a hue", () => {
    expect(describeHue(0)).toBe("red");
    expect(describeHue(359)).toBe("red");
    expect(describeHue(-120)).toBe("blue");
  });
});
