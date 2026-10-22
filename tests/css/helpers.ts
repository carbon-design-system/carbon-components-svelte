import { parseRules } from "crassus";
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

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of two `#rrggbb` colors. */
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
