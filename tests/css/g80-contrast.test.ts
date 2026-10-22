// @vitest-environment node
import { contrast, themeTokens } from "./helpers";

// v11 has no Gray 80, so its values are this library's own and nothing
// upstream checks them. Its layer-01 is #525252, one step lighter than Gray
// 90's, so a value that passes in Gray 90 can fail here.
const SURFACES = ["background", "layer-01", "layer-02"];

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
