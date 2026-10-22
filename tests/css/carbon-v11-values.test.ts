// @vitest-environment node
import { parseRules } from "crassus";
import { extractTokens } from "../../scripts/lib/tokens";
import reference from "./carbon-themes-v11.json";
import { compileEntry } from "./compile";

const THEMES = ["white", "g10", "g90", "g100"] as const;

type Theme = (typeof THEMES)[number];
type Values = Record<string, (string | null)[]>;

const normalize = (value: string) => value.replace(/\s+/g, "").toLowerCase();

describe("Carbon v11 token values", () => {
  it("all.css declares the @carbon/themes value in white, g10, g90 and g100", async () => {
    const data = extractTokens(await compileEntry("all.scss"));
    const declared = (name: string, theme: Theme) =>
      data.component[name]?.[theme] ?? data.color[name]?.[theme];
    // Notification backgrounds read the contextual layer token, which holds
    // the value v11 gives them at the page level.
    const resolve = (value: string, theme: Theme) =>
      value.replace(
        /^var\(--cds-([\w-]+)\)$/,
        (_, name: string) => declared(name, theme) ?? value,
      );

    const mismatches: string[] = [];
    let compared = 0;
    for (const values of [
      reference.component as Values,
      reference.theme as Values,
    ]) {
      for (const [name, expected] of Object.entries(values)) {
        for (const [i, theme] of THEMES.entries()) {
          const want = expected[i];
          if (want === null) continue;
          const have = declared(name, theme);
          // Placeholders keep text-helper: v11's 40% gray is 2.6:1 on a field.
          const wanted =
            name === "text-placeholder"
              ? reference.theme["text-helper"][i]
              : want;
          compared++;
          if (normalize(resolve(have ?? "", theme)) !== normalize(wanted)) {
            mismatches.push(`${name} ${theme}: ${have} (v11 ${wanted})`);
          }
        }
      }
    }

    expect(mismatches).toEqual([]);
    expect(compared).toBeGreaterThan(750);
  }, 60_000);

  it("the reference covers every component token all.css declares", async () => {
    const data = extractTokens(await compileEntry("all.scss"));
    const names = Object.keys(data.component);

    expect(names.length).toBeGreaterThan(40);
    expect(names.filter((name) => !(name in reference.component))).toEqual([]);
  }, 60_000);

  it.each(THEMES)(
    "%s.css compiles the v11 component values",
    async (theme) => {
      const rules = parseRules(await compileEntry(`${theme}.scss`));
      const value = (selector: string, property: string) =>
        rules
          .find(
            (rule) =>
              rule.selector === selector &&
              rule.context === "" &&
              rule.decls.has(property),
          )
          ?.decls.get(property)
          ?.toString();
      const i = THEMES.indexOf(theme);
      const { component } = reference;

      expect(value(".bx--btn--primary:hover", "background-color")).toBe(
        component["button-primary-hover"][i],
      );
      expect(value(".bx--btn--secondary:hover", "background-color")).toBe(
        component["button-secondary-hover"][i],
      );
      expect(value(".bx--tag--red", "background-color")).toBe(
        component["tag-background-red"][i],
      );
      expect(value(".bx--tag--gray", "color")).toBe(
        component["tag-color-gray"][i],
      );
    },
    120_000,
  );
});
