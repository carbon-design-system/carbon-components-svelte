import {
  blend,
  contrastRatio,
  toHex,
  toRgba,
} from "../../src/devtools/LayoutInspector/colors.js";

describe("toRgba", () => {
  test("parses canvas hex and rgba forms", () => {
    expect(toRgba("#0f62fe")).toEqual([15, 98, 254, 1]);
    expect(toRgba("rgba(22, 22, 22, 0.5)")).toEqual([22, 22, 22, 0.5]);
  });

  test("is null for no color", () => {
    expect(toRgba(null)).toBeNull();
    expect(toRgba("none")).toBeNull();
  });
});

describe("toHex", () => {
  test("writes opaque colors as hex", () => {
    expect(toHex([15, 98, 254, 1])).toBe("#0f62fe");
  });

  test("adds the opacity of a translucent color", () => {
    expect(toHex([0, 0, 0, 0.5])).toBe("#000000 50%");
  });
});

describe("blend", () => {
  test("composites a translucent color over an opaque one", () => {
    expect(blend([0, 0, 0, 0.5], [255, 255, 255, 1])).toEqual([
      127.5, 127.5, 127.5, 1,
    ]);
  });
});

describe("contrastRatio", () => {
  test("is 21:1 for black on white", () => {
    expect(contrastRatio([0, 0, 0, 1], [255, 255, 255, 1])).toBeCloseTo(21);
  });

  test("is the same in either order", () => {
    const a: [number, number, number, number] = [15, 98, 254, 1];
    const b: [number, number, number, number] = [255, 255, 255, 1];
    expect(contrastRatio(a, b)).toBe(contrastRatio(b, a));
  });

  test("puts Carbon's helper text gray just over AA", () => {
    // $text-helper (#6f6f6f) on $background (#ffffff).
    expect(
      contrastRatio([111, 111, 111, 1], [255, 255, 255, 1]),
    ).toBeGreaterThan(4.5);
  });
});
