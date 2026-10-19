// @vitest-environment node
import { getAvatarBackgroundColor } from "../../src/utils/avatar-color.js";

const DEFAULT_PALETTE = [
  "red",
  "magenta",
  "purple",
  "blue",
  "cyan",
  "teal",
  "green",
];

describe("getAvatarBackgroundColor", () => {
  it("maps the same input to the same color", () => {
    expect(getAvatarBackgroundColor("Jane Roe")).toBe(
      getAvatarBackgroundColor("Jane Roe"),
    );
  });

  it("returns a color from the default palette", () => {
    // "Jane Roe" hashes to a negative signed 32-bit integer.
    for (const value of ["Richard Hendricks", "Jane Roe", "🚀"]) {
      expect(DEFAULT_PALETTE).toContain(getAvatarBackgroundColor(value));
    }
  });

  it("distributes varied inputs across more than one color", () => {
    const names = [
      "Monica",
      "Richard",
      "Dinesh",
      "Gilfoyle",
      "Jared",
      "Erlich",
    ];
    const colors = new Set(names.map((name) => getAvatarBackgroundColor(name)));
    expect(colors.size).toBeGreaterThan(1);
  });

  it("returns the first palette entry for empty or nullish input", () => {
    expect(getAvatarBackgroundColor("")).toBe(DEFAULT_PALETTE[0]);
    expect(getAvatarBackgroundColor(null)).toBe(DEFAULT_PALETTE[0]);
    expect(getAvatarBackgroundColor(undefined)).toBe(DEFAULT_PALETTE[0]);
  });

  it("supports a custom palette", () => {
    const palette = ["one", "two"] as const;
    const color = getAvatarBackgroundColor("anything", palette);
    expect(palette).toContain(color);
  });

  it("falls back to the default palette for an empty palette", () => {
    expect(DEFAULT_PALETTE).toContain(getAvatarBackgroundColor("anything", []));
    expect(getAvatarBackgroundColor("", [])).toBe(DEFAULT_PALETTE[0]);
  });
});
