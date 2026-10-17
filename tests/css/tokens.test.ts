// @vitest-environment node
// @depends-on css/vendor/carbon-components/scss/globals/scss/vendor/@carbon/elements/scss/themes/generated/_tokens.scss
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  colorTokenDescriptions,
  colorTokens,
  componentTokens,
  containerTokens,
  layoutTokens,
  sizeTokens,
  spacingTokens,
  typeTokens,
} from "carbon-components-svelte/tokens";
import { extractTokens, TOKENS_SCSS } from "../../scripts/lib/tokens";
import { compileEntry } from "./compile";

describe("token data", () => {
  it("matches the tokens all.css declares", async () => {
    const data = extractTokens(
      await compileEntry("all.scss"),
      readFileSync(join(__dirname, "../..", TOKENS_SCSS), "utf8"),
    );

    // A stale module means scripts/build-ts needs a rerun.
    expect(colorTokens).toEqual(data.color);
    expect(colorTokenDescriptions).toEqual(data.descriptions);
    expect(componentTokens).toEqual(data.component);
    expect(typeTokens).toEqual(data.type);
    expect(spacingTokens).toEqual(data.spacing);
    expect(layoutTokens).toEqual(data.layout);
    expect(containerTokens).toEqual(data.container);
    expect(sizeTokens).toEqual(data.size);
  }, 60_000);

  it("gives every theme a value for each color", () => {
    expect(colorTokens["ui-background"]).toEqual({
      white: "#ffffff",
      g10: "#f4f4f4",
      g80: "#393939",
      g90: "#262626",
      g100: "#161616",
    });
    expect(colorTokenDescriptions["interactive-01"]).toBe(
      "Primary interactive color; Primary buttons",
    );
    for (const values of Object.values(componentTokens)) {
      expect(Object.keys(values)).toEqual([
        "white",
        "g10",
        "g80",
        "g90",
        "g100",
      ]);
    }
  });

  it("exports only Carbon v10 names", () => {
    expect(Object.keys(typeTokens)).toHaveLength(34);
    expect(typeTokens["heading-01"]).toEqual({
      "font-size": "0.875rem",
      "font-weight": "600",
      "line-height": "1.42857",
      "letter-spacing": "0.16px",
    });

    for (const name of ["text-primary", "layer", "background", "brand-01"]) {
      expect(colorTokens).not.toHaveProperty(name);
    }
    for (const name of ["body-compact-01", "heading-03", "fluid-display-01"]) {
      expect(typeTokens).not.toHaveProperty(name);
    }
  });
});
