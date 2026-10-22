// @vitest-environment node
import { parseRules, type Rule } from "crassus";
import { compileEntry } from "./compile";

type Declarations = Map<string, string>;

const THEMES = ["white", "g10", "g80", "g90", "g100"] as const;
type Theme = (typeof THEMES)[number];

// The custom properties an element declares itself, from the unconditional
// rules whose selector is one of `selectors`, in cascade order. Every
// selector here has the same specificity, so source order decides.
function declared(rules: Rule[], selectors: string[]): Declarations {
  const result: Declarations = new Map();
  for (const rule of rules) {
    if (rule.context !== "" || !selectors.includes(rule.selector)) continue;
    for (const [prop, value] of rule.decls) {
      if (prop.startsWith("--")) result.set(prop, value);
    }
  }
  return result;
}

// What `<html theme="…">` declares: `:root`, then its theme block.
const page = (rules: Rule[], theme: Theme) =>
  declared(
    rules,
    theme === "white" ? [":root"] : [":root", `:root[theme=${theme}]`],
  );

// What a zone element declares. Inherited values fill in the rest.
const zone = (rules: Rule[], theme: Theme) =>
  declared(rules, [`.bx--${theme}`]);

const inherit = (parent: Declarations, own: Declarations): Declarations =>
  new Map([...parent, ...own]);

// Tokens whose value differs from `expected`, as `name: actual != expected`.
function mismatches(actual: Declarations, expected: Declarations) {
  const names = new Set([...actual.keys(), ...expected.keys()]);
  return [...names]
    .filter((name) => actual.get(name) !== expected.get(name))
    .map((name) => `${name}: ${actual.get(name)} != ${expected.get(name)}`);
}

describe("theme zones", () => {
  let rules: Rule[] = [];
  beforeAll(async () => {
    rules = parseRules(await compileEntry("all.scss"));
  }, 30_000);

  it("declares every token a page in the same theme does", () => {
    for (const theme of THEMES) {
      const own = zone(rules, theme);
      expect(own.size, theme).toBeGreaterThan(300);
      // Nothing to inherit: the zone holds the full set itself.
      expect(mismatches(own, page(rules, theme)), theme).toEqual([]);
    }
  });

  it("matches its theme's page values in every page theme", () => {
    for (const pageTheme of THEMES) {
      for (const theme of THEMES) {
        const nested = inherit(page(rules, pageTheme), zone(rules, theme));
        expect(
          mismatches(nested, page(rules, theme)),
          `${theme} zone on a ${pageTheme} page`,
        ).toEqual([]);
      }
    }
  });

  it("gives a g10 zone g10's values inside g100", () => {
    const nested = inherit(page(rules, "g100"), zone(rules, "g10"));
    const g10 = page(rules, "g10");
    expect(nested.get("--cds-background")).toBe(g10.get("--cds-background"));
    expect(nested.get("--cds-background")).toBe("#f4f4f4");
    // g10 shares these with white, so its own block omits them.
    expect(nested.get("--cds-text-primary")).toBe("#161616");
    expect(nested.get("--cds-focus")).toBe("#0f62fe");
  });

  it("gives a white zone white's values inside g100", () => {
    const nested = inherit(page(rules, "g100"), zone(rules, "white"));
    expect(mismatches(nested, page(rules, "white"))).toEqual([]);
    expect(nested.get("--cds-background")).toBe("#ffffff");
    expect(nested.get("--cds-layer")).toBe("#f4f4f4");
    expect(nested.get("--ccs-status-red")).toBe("#da1e28");
    expect(nested.get("--cds-content-switcher-background")).toBe("#e0e0e0");
  });

  it("nests zones", () => {
    const outer = inherit(page(rules, "white"), zone(rules, "g100"));
    const inner = inherit(outer, zone(rules, "g10"));
    expect(mismatches(inner, page(rules, "g10"))).toEqual([]);
  });

  // A zone inside a Layer starts a new stack: its contextual tokens hold
  // the level 1 values, not the Layer's.
  it("resets the contextual tokens to level 1", () => {
    const layer = declared(rules, [".bx--layer-three"]);
    expect(layer.get("--cds-layer")).toBe("var(--cds-layer-03)");
    for (const theme of THEMES) {
      const nested = inherit(
        inherit(page(rules, "g100"), layer),
        zone(rules, theme),
      );
      const expected = page(rules, theme);
      for (const token of layer.keys()) {
        expect(nested.get(token), `${theme} ${token}`).toBe(
          expected.get(token),
        );
      }
    }
  });

  it("paints the zone and sets its color scheme", () => {
    const paint = rules.find((r) => r.selector === ".bx--theme-zone");
    expect(paint?.decls.get("background-color")).toBe("var(--cds-background)");
    expect(paint?.decls.get("color")).toBe("var(--cds-text-primary)");

    const scheme = (theme: Theme) =>
      rules
        .filter((r) => r.selector === `.bx--${theme}` && r.context === "")
        .map((r) => r.decls.get("color-scheme"))
        .filter(Boolean)
        .at(-1);
    expect(scheme("white")).toBe("light");
    expect(scheme("g10")).toBe("light");
    expect(scheme("g80")).toBe("dark");
    expect(scheme("g90")).toBe("dark");
    expect(scheme("g100")).toBe("dark");
  });

  // A rule scoped under `[theme=…]` reads the page theme, not the nearest
  // zone, so a component inside a zone would take the page's colors. Per
  // theme values belong in the theme blocks, as custom properties.
  it("scopes nothing under a theme attribute but the theme blocks", () => {
    const scoped = rules
      .filter((r) => r.selector.includes("[theme"))
      .filter((r) => !/^:root\[theme=\w+\]$/.test(r.selector))
      .map((r) => r.selector);
    expect(scoped).toEqual([]);
  });
});
