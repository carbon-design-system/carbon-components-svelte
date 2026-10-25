import { parseRules } from "crassus";
import { contrastRatio } from "../../src/utils/color-contrast.js";
import { compileEntry } from "./compile";

export const THEMES = ["white", "g10", "g80", "g90", "g100"] as const;

/** `--*` declarations per theme in all.css, each filled in from white. */
export async function themeTokens() {
  const rules = parseRules(await compileEntry("all.scss"));
  const block = (selector: string) =>
    Object.fromEntries(
      rules
        .filter((r) => r.selector === selector && r.context === "")
        .flatMap((r) => [...r.decls])
        .filter(([prop]) => prop.startsWith("--")),
    );
  const white = block(":root");
  return {
    rules,
    themes: Object.fromEntries(
      THEMES.map((theme) => [
        theme,
        theme === "white"
          ? white
          : { ...white, ...block(`:root[theme=${theme}]`) },
      ]),
    ) as Record<(typeof THEMES)[number], Record<string, string>>,
  };
}

/** WCAG contrast ratio of two hex colors. Throws for any other value. */
export function contrast(a: string, b: string) {
  const ratio = contrastRatio(a, b);
  if (ratio === null) throw new Error(`Not a hex color pair: ${a}, ${b}`);
  return ratio;
}
