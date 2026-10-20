// @vitest-environment node
import {
  colorTokens,
  componentTokens,
  containerTokens,
  layoutTokens,
  sizeTokens,
  spacingTokens,
  typeTokens,
} from "carbon-components-svelte/tokens";
import { extractTokens } from "../../scripts/lib/tokens";
import { compileEntry } from "./compile";

describe("token data", () => {
  it("matches the tokens all.css declares", async () => {
    const data = extractTokens(await compileEntry("all.scss"));

    // A stale module means scripts/build-tokens.ts needs a rerun.
    expect(colorTokens).toEqual(data.color);
    expect(componentTokens).toEqual(data.component);
    expect(typeTokens).toEqual(data.type);
    expect(spacingTokens).toEqual(data.spacing);
    expect(layoutTokens).toEqual(data.layout);
    expect(containerTokens).toEqual(data.container);
    expect(sizeTokens).toEqual(data.size);
  }, 60_000);

  it("gives every theme a value for each color", () => {
    expect(colorTokens.background).toEqual({
      white: "#ffffff",
      g10: "#f4f4f4",
      g80: "#393939",
      g90: "#262626",
      g100: "#161616",
    });
    // A contextual token holds its first-layer value.
    expect(colorTokens.layer).toEqual(colorTokens["layer-01"]);
    for (const values of [
      ...Object.values(colorTokens),
      ...Object.values(componentTokens),
    ]) {
      expect(Object.keys(values)).toEqual([
        "white",
        "g10",
        "g80",
        "g90",
        "g100",
      ]);
    }
  });

  it("exports only Carbon v11 names", () => {
    expect(typeTokens["heading-compact-01"]).toEqual({
      "font-size": "0.875rem",
      "font-weight": "600",
      "line-height": "1.28572",
      "letter-spacing": "0.16px",
    });
    expect(componentTokens).toHaveProperty("button-primary");
    expect(colorTokens).toHaveProperty("chat-bubble-user");

    for (const name of ["ui-background", "ui-01", "text-01", "brand-01"]) {
      expect(colorTokens).not.toHaveProperty(name);
    }
    for (const name of ["body-short-01", "productive-heading-01"]) {
      expect(typeTokens).not.toHaveProperty(name);
    }
  });
});
