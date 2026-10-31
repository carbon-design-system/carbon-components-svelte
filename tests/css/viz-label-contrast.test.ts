import { compileEntry } from "./compile";

const THEMES = ["white", "g10", "g80", "g90", "g100"];
const SEQUENTIAL = ["purple", "blue", "cyan", "teal"];
const DIVERGING = ["red-cyan", "purple-teal"];

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function expand(hex: string): string {
  return hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
}

const pad = (n: number) => String(n).padStart(2, "0");

describe("viz ramp label contrast", () => {
  it.each(THEMES)(
    "every ramp step has a label color at 4.5:1 or better in %s",
    async (theme) => {
      const css = await compileEntry(`viz-${theme}.scss`);
      const token = (name: string) => {
        const match = css.match(
          new RegExp(`--cds-viz-${name}:\\s*(#[0-9a-fA-F]{3,6})\\b`),
        );
        if (!match) throw new Error(`--cds-viz-${name} is not declared`);
        return expand(match[1]);
      };

      const failures: string[] = [];
      const check = (fill: string, label: string) => {
        const ratio = contrast(token(fill), token(label));
        if (ratio < 4.5)
          failures.push(`${fill} on ${label}: ${ratio.toFixed(2)}`);
      };
      for (const hue of SEQUENTIAL) {
        for (let s = 1; s <= 11; s++)
          check(`seq-${hue}-${pad(s)}`, `seq-on-${pad(s)}`);
      }
      for (const palette of DIVERGING) {
        for (let s = 1; s <= 17; s++) {
          check(`div-${palette}-${pad(s)}`, `div-on-${pad(s)}`);
        }
      }
      expect(failures).toEqual([]);
    },
    60_000,
  );
});
