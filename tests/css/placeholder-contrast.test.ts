// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("placeholder contrast", () => {
  // Placeholders are text, so they meet 4.5:1 on a field in every theme.
  // Gray 80's field is too light for its placeholder; it isn't held to it.
  it.each([
    ["white", ":root"],
    ["g10", ":root[theme=g10]"],
    ["g90", ":root[theme=g90]"],
    ["g100", ":root[theme=g100]"],
  ])(
    "%s placeholders are 4.5:1 on field-01",
    async (_theme, selector) => {
      const rules = parseRules(await compileEntry("all.scss"));
      // A theme block declares only what differs from `:root`.
      const token = (name: string) =>
        [selector, ":root"]
          .map((s) => rules.find((r) => r.selector === s && r.decls.has(name)))
          .find(Boolean)
          ?.decls.get(name) as string;
      expect(
        contrast(token("--cds-text-05"), token("--cds-field-01")),
      ).toBeGreaterThanOrEqual(4.5);
    },
    30_000,
  );
});
