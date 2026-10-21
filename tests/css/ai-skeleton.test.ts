// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// The `ai` variant of the skeletons reads the v11 ai-skeleton-* tokens, so
// it follows the theme, and stops its shimmer under reduced motion.
const VARIANTS = ["text", "placeholder", "icon"].map(
  (name) => `.bx--skeleton__${name}--ai`,
);

describe("AI skeleton", () => {
  let rules: ReturnType<typeof parseRules> = [];
  beforeAll(async () => {
    rules = parseRules(await compileEntry("all.scss"));
  }, 30_000);

  const decl = (selector: string, prop: string, context = "") =>
    rules
      .filter((r) => r.selector === selector && r.context === context)
      .map((r) => r.decls.get(prop))
      .findLast(Boolean);

  it.each(VARIANTS)("%s draws its surface with ai-skeleton-background", (s) => {
    expect(decl(s, "background")).toBe("var(--cds-ai-skeleton-background)");
    expect(decl(s, "overflow")).toBe("hidden");
  });

  it.each(VARIANTS)(
    "%s sweeps a gradient of ai-skeleton-element-background",
    (s) => {
      expect(decl(`${s}::before`, "background")).toContain(
        "var(--cds-ai-skeleton-element-background)",
      );
      expect(decl(`${s}::before`, "animation")).toMatch(/\bai-skeleton\b/);
    },
  );

  it.each(VARIANTS)(
    "%s sets the token's alpha to half where browsers can",
    (s) => {
      const background = rules
        .filter(
          (r) =>
            r.selector === `${s}::before` && r.context.startsWith("@supports"),
        )
        .map((r) => r.decls.get("background"))
        .find(Boolean);
      expect(background).toMatch(
        /rgb\(from var\(--cds-ai-skeleton-element-background\) r g b ?\/ ?0\.5\) 50%/,
      );
    },
  );

  it.each(VARIANTS)("%s stops the shimmer under reduced motion", (s) => {
    expect(
      decl(
        `${s}::before`,
        "animation",
        "@media (prefers-reduced-motion:reduce)",
      ),
    ).toBe("none");
  });

  it.each(VARIANTS)("%s uses system colors in forced colors", (s) => {
    const context = "@media (forced-colors:active)";
    expect(decl(s, "background", context)).toBe("CanvasText");
    expect(decl(`${s}::before`, "background", context)).toBe("Canvas");
  });

  it("reads the theme's values in a single-theme sheet", async () => {
    const g100 = parseRules(await compileEntry("g100.scss"));
    const get = (selector: string, prop: string) =>
      g100
        .filter((r) => r.selector === selector && r.context === "")
        .map((r) => r.decls.get(prop))
        .find(Boolean);
    expect(get(".bx--skeleton__text--ai", "background")).toMatch(
      /^rgba\(120,\s*169,\s*255,\s*0\.5\)$/,
    );
    expect(get(".bx--skeleton__text--ai::before", "background")).toMatch(
      /rgba\(120,\s*169,\s*255,\s*0\.5\) 50%/,
    );
  }, 30_000);
});
