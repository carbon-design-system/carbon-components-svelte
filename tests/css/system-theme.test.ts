// @vitest-environment node
import { parseRules, type Rule } from "crassus";
import { compileEntry } from "./compile";

type Declarations = Map<string, string>;

const DARK = /prefers-color-scheme:\s*dark/;

// The custom properties and color-scheme the rules for `selectors` declare,
// in source order. With `dark`, the rules in the dark media query apply too.
function declared(rules: Rule[], selectors: string[], dark: boolean) {
  const result: Declarations = new Map();
  for (const rule of rules) {
    if (!selectors.includes(rule.selector)) continue;
    if (rule.context !== "" && !(dark && DARK.test(rule.context))) continue;
    for (const [prop, value] of rule.decls) {
      if (prop.startsWith("--") || prop === "color-scheme") {
        result.set(prop, value);
      }
    }
  }
  return result;
}

const tokens = (declarations: Declarations) =>
  Object.fromEntries(
    [...declarations].filter(
      ([prop]) => prop.startsWith("--cds-") || prop.startsWith("--ccs-"),
    ),
  );

// `<html theme="…">` without the system theme: `:root`, then its block.
const page = (rules: Rule[], theme: string) =>
  declared(
    rules,
    theme === "white" ? [":root"] : [":root", `:root[theme=${theme}]`],
    false,
  );

describe("all.css system theme", () => {
  let rules: Rule[] = [];
  beforeAll(async () => {
    rules = parseRules(await compileEntry("all.scss"));
  }, 30_000);

  const system = (dark: boolean) =>
    declared(rules, [":root", ":root[theme=system]"], dark);
  const zone = (dark: boolean) => declared(rules, [".bx--system"], dark);

  it("is White when the system prefers light", () => {
    expect(tokens(system(false))).toEqual(tokens(page(rules, "white")));
    expect(tokens(zone(false))).toEqual(tokens(page(rules, "white")));
    expect(zone(false).get("color-scheme")).toBe("light");
  });

  it("is Gray 100 when the system prefers dark", () => {
    expect(tokens(system(true))).toEqual(tokens(page(rules, "g100")));
    expect(tokens(zone(true))).toEqual(tokens(page(rules, "g100")));
    expect(system(true).get("color-scheme")).toBe("dark");
    expect(zone(true).get("color-scheme")).toBe("dark");
  });

  it("keeps a system zone in its scheme on any page theme", () => {
    for (const pageTheme of ["white", "g10", "g80", "g90", "g100"]) {
      for (const dark of [false, true]) {
        const nested = new Map([...page(rules, pageTheme), ...zone(dark)]);
        expect(tokens(nested), `${pageTheme} page, dark ${dark}`).toEqual(
          tokens(page(rules, dark ? "g100" : "white")),
        );
      }
    }
  });

  it("declares each page theme's color scheme, light ones included", () => {
    for (const [theme, scheme] of [
      ["white", "light"],
      ["g10", "light"],
      ["g80", "dark"],
      ["g90", "dark"],
      ["g100", "dark"],
    ]) {
      expect(page(rules, theme).get("color-scheme"), theme).toBe(scheme);
    }
    expect(system(false).get("color-scheme")).toBe("light");
  });

  // The dark block reuses the Gray 100 mixin: it adds what Gray 100
  // changes from White, not a second full set.
  it("declares only Gray 100's difference from White in the media query", () => {
    const media = rules.filter((r) => DARK.test(r.context));
    expect(media.map((r) => r.selector).sort()).toEqual(
      [":root[theme=system]", ".bx--system"].sort(),
    );
    const g100 = rules.find(
      (r) => r.selector === ":root[theme=g100]" && r.context === "",
    );
    expect(Object.fromEntries(media[0].decls)).toEqual(
      Object.fromEntries(g100?.decls ?? []),
    );
  });
});

describe("syntax-tokens.css system theme", () => {
  it("takes the light set, then the dark set when the system prefers dark", async () => {
    const rules = parseRules(await compileEntry("syntax-tokens.scss"));
    const light = declared(rules, [":root"], false);
    const g100 = declared(rules, [":root", ":root[theme=g100]"], false);
    for (const selectors of [
      [":root", ":root[theme=system]"],
      [".bx--system"],
    ]) {
      expect(Object.fromEntries(declared(rules, selectors, false))).toEqual(
        Object.fromEntries(light),
      );
      expect(Object.fromEntries(declared(rules, selectors, true))).toEqual(
        Object.fromEntries(g100),
      );
    }
  }, 30_000);
});
