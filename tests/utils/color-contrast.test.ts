// @vitest-environment node
import {
  contrastRatio,
  parseHex,
  relativeLuminance,
  toHex,
} from "../../src/utils/color-contrast.js";

describe("parseHex", () => {
  it.each([
    ["#0f62fe", [15 / 255, 98 / 255, 254 / 255]],
    ["#0F62FE", [15 / 255, 98 / 255, 254 / 255]],
    ["#fff", [1, 1, 1]],
    ["#000000", [0, 0, 0]],
  ])("parses %s", (color, rgb) => {
    expect(parseHex(color)).toEqual(rgb);
  });

  it.each([
    "0f62fe",
    "#0f62f",
    "#0f62fe80",
    "#ggg",
    "rgb(0, 0, 0)",
    "rgba(0, 0, 0, 0.5)",
    "var(--cds-background)",
    "",
  ])("returns null for %j", (color) => {
    expect(parseHex(color)).toBeNull();
  });
});

describe("toHex", () => {
  it("round-trips a parsed color in lowercase", () => {
    const rgb = parseHex("#0F62FE");
    assert(rgb);
    expect(toHex(rgb)).toBe("#0f62fe");
  });

  it("clamps channels outside 0 to 1", () => {
    expect(toHex([-0.5, 0.5, 1.5])).toBe("#0080ff");
  });
});

describe("relativeLuminance", () => {
  it("is 1 for white and 0 for black", () => {
    expect(relativeLuminance([1, 1, 1])).toBeCloseTo(1, 10);
    expect(relativeLuminance([0, 0, 0])).toBe(0);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white, in either order", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 10);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 10);
  });

  it("is 1 for the same color", () => {
    expect(contrastRatio("#0f62fe", "#0f62fe")).toBe(1);
  });

  // Carbon's text-on-color on button-primary in the white theme.
  it("gives 5.0:1 for white on blue 60", () => {
    expect(contrastRatio("#ffffff", "#0f62fe")).toBeCloseTo(5, 2);
  });

  it("returns null when either color is not hex", () => {
    expect(contrastRatio("#ffffff", "rgba(0, 0, 0, 0.5)")).toBeNull();
    expect(contrastRatio("transparent", "#ffffff")).toBeNull();
  });
});
