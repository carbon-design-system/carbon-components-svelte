// @vitest-environment node
import { contrast, themeTokens } from "./helpers";

// v11 has no Gray 80, so its values are this library's own and nothing
// upstream checks them. Its layer-01 is #525252, one step lighter than Gray
// 90's, so a value that passes in Gray 90 can fail here.
const SURFACES = ["background", "layer-01", "layer-02", "layer-03"];

// Small text and icons need 4.5:1 on every surface. link-primary,
// link-visited and the support colors drop below it on #525252, as they do
// on Gray 90's layer-02, so they are held on the background only.
const PAIRS: [token: string, surfaces: string[], min: number][] = [
  ["--cds-text-primary", SURFACES, 4.5],
  ["--cds-text-secondary", SURFACES, 4.5],
  ["--cds-text-helper", SURFACES, 4.5],
  ["--cds-text-placeholder", SURFACES, 4.5],
  ["--cds-text-error", SURFACES, 4.5],
  ["--ccs-text-success", SURFACES, 4.5],
  ["--cds-link-secondary", SURFACES, 4.5],
  ["--cds-link-primary-hover", SURFACES, 4.5],
  ["--cds-icon-primary", SURFACES, 4.5],
  ["--cds-icon-secondary", SURFACES, 4.5],
  ["--cds-link-primary", ["background"], 4.5],
  ["--cds-link-visited", ["background"], 4.5],
  ["--cds-support-error", ["background"], 4.5],
  ["--cds-support-success", ["background"], 4.5],
  ["--cds-support-warning", ["background"], 4.5],
  // Focus rings, interactive borders and field borders need 3:1.
  ["--cds-focus", SURFACES, 3],
  ["--cds-border-interactive", SURFACES, 3],
  ["--cds-interactive", SURFACES, 3],
  ["--cds-border-strong-01", SURFACES, 3],
];

describe("Gray 80 contrast", () => {
  it.each(PAIRS)(
    "%s passes on %j",
    async (token, surfaces, min) => {
      const tokens = (await themeTokens()).themes.g80;
      expect(tokens[token], token).toMatch(/^#[\da-f]{6}$/);
      for (const surface of surfaces) {
        const background = tokens[`--cds-${surface}`];
        expect(background, surface).toMatch(/^#[\da-f]{6}$/);
        expect(
          contrast(tokens[token], background),
          `${token} on ${surface}`,
        ).toBeGreaterThanOrEqual(min);
      }
    },
    30_000,
  );
});

// A zebra row or table header is layer-accent, and a field is field-0N, so
// secondary text, helper text and placeholders sit on them at every level.
// No gray lighter than layer-01's #525252 holds them at 4.5:1, so these
// surfaces step darker. Each still reads on its layer and on the surface one
// level down, where a field, track or tab sits, by 1.15:1. Gray 10's zebra
// step (#e0e0e0 on #f4f4f4) is 1.2:1.
const TEXT = [
  "text-primary",
  "text-secondary",
  "text-helper",
  "text-placeholder",
  "icon-secondary",
];

describe("Gray 80 accents and fields", () => {
  it.each(["01", "02", "03"])(
    "level %s holds secondary text",
    async (level) => {
      const tokens = (await themeTokens()).themes.g80;
      const color = (name: string) => {
        const value = tokens[`--cds-${name}`];
        expect(value, name).toMatch(/^#[\da-f]{6}$/);
        return value;
      };
      const below = level === "01" ? "background" : `layer-0${+level - 1}`;
      for (const [fill, surfaces] of [
        [`layer-accent-${level}`, [`layer-${level}`, below]],
        [`field-${level}`, [below]],
      ] as const) {
        for (const text of TEXT) {
          expect(
            contrast(color(text), color(fill)),
            `${text} on ${fill}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
        for (const surface of surfaces) {
          expect(
            contrast(color(fill), color(surface)),
            `${fill} on ${surface}`,
          ).toBeGreaterThanOrEqual(1.15);
        }
      }
    },
    30_000,
  );
});

// Gray 80's layer-01 is Gray 90's layer-02, so its states take Gray 90's
// values for the same surface. Each one stands apart from the color it
// replaces by 1.2:1, about Gray 90's smallest step, and a selected border
// shows on a selected layer. Hovered and selected rows switch to
// text-primary, so it holds 4.5:1 on all of them.
const STATES: [state: string, surface: string, min: number][] = [
  ["layer-hover", "layer", 1.2],
  ["layer-selected", "layer", 1.2],
  ["layer-selected-hover", "layer-selected", 1.2],
  ["field-hover", "field", 1.2],
  ["border-subtle-selected", "layer-selected", 1.5],
];

describe("Gray 80 layer states", () => {
  it.each(["01", "02", "03"])(
    "level %s states read on their surface",
    async (level) => {
      const tokens = (await themeTokens()).themes.g80;
      const color = (name: string) => {
        const value = tokens[`--cds-${name}-${level}`];
        expect(value, `${name}-${level}`).toMatch(/^#[\da-f]{6}$/);
        return value;
      };
      for (const [state, surface, min] of STATES) {
        expect(
          contrast(color(state), color(surface)),
          `${state}-${level} on ${surface}-${level}`,
        ).toBeGreaterThanOrEqual(min);
      }
      for (const fill of [
        "layer",
        "layer-hover",
        "layer-selected",
        "layer-selected-hover",
        "field",
        "field-hover",
      ]) {
        expect(
          contrast(tokens["--cds-text-primary"], color(fill)),
          `text-primary on ${fill}-${level}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
    30_000,
  );
});

/** `color` painted over the opaque `surface`, as `#rrggbb`. */
function over(color: string, surface: string) {
  const rgba = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  if (!rgba) return color;
  const alpha = Number(rgba[4]);
  return `#${[1, 2, 3]
    .map((i) => {
      const under = Number.parseInt(surface.slice(2 * i - 1, 2 * i + 1), 16);
      const value = Math.round(alpha * Number(rgba[i]) + (1 - alpha) * under);
      return value.toString(16).padStart(2, "0");
    })
    .join("")}`;
}

// Background states and disabled colors are translucent, as in every v11
// dark theme. Over the page, each state still reads and keeps text-primary
// at 4.5:1.
describe("Gray 80 background states", () => {
  it.each([
    "background-hover",
    "background-selected",
    "background-selected-hover",
    "background-active",
  ])(
    "%s reads on the background",
    async (state) => {
      const tokens = (await themeTokens()).themes.g80;
      const background = tokens["--cds-background"];
      expect(tokens[`--cds-${state}`]).toMatch(/^rgba\(/);
      const fill = over(tokens[`--cds-${state}`], background);
      expect(contrast(fill, background)).toBeGreaterThanOrEqual(1.2);
      expect(
        contrast(tokens["--cds-text-primary"], fill),
      ).toBeGreaterThanOrEqual(4.5);
    },
    30_000,
  );
});

// Tags are dark on a dark page, with light text at 4.5:1. A neutral tag
// also needs to show its shape on the page and on layer-01, where a table
// row or tile puts it; the hues show by color.
const TAGS = [
  "red",
  "magenta",
  "purple",
  "blue",
  "cyan",
  "teal",
  "green",
  "gray",
  "cool-gray",
  "warm-gray",
];
const NEUTRAL_TAGS = new Set(["gray", "cool-gray", "warm-gray"]);

describe("Gray 80 tags", () => {
  it.each(TAGS)(
    "%s tags are dark with readable text",
    async (color) => {
      const tokens = (await themeTokens()).themes.g80;
      const fill = tokens[`--cds-tag-background-${color}`];
      const text = tokens[`--cds-tag-color-${color}`];
      expect(fill).toMatch(/^#[\da-f]{6}$/);
      expect(contrast(fill, "#000000")).toBeLessThan(contrast(text, "#000000"));
      expect(contrast(text, fill)).toBeGreaterThanOrEqual(4.5);
      if (NEUTRAL_TAGS.has(color)) {
        for (const surface of ["background", "layer-01"]) {
          expect(
            contrast(fill, tokens[`--cds-${surface}`]),
            `on ${surface}`,
          ).toBeGreaterThanOrEqual(1.5);
        }
      }
    },
    30_000,
  );
});
