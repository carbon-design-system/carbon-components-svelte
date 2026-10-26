// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

const ROOTS = [
  ".bx--grid-overlay",
  ".bx--layout-inspector",
  ".bx--dev-toolbar",
] as const;

describe("devtools", () => {
  it("ships in devtools.css, not in the theme sheets", async () => {
    const [all, white, devtools] = await Promise.all(
      ["all.scss", "white.scss", "devtools.scss"].map(compileEntry),
    );
    for (const root of ROOTS) {
      expect(all).not.toContain(root);
      expect(white).not.toContain(root);
      expect(devtools).toContain(root);
    }
  }, 30_000);

  it("stacks the toolbar over the inspector over the overlay", async () => {
    // A standalone sheet must import every Sass helper it calls, or the
    // call stays in the CSS as text and the browser drops the declaration.
    const rules = parseRules(await compileEntry("devtools.scss"));
    const zIndex = ROOTS.map((root) => {
      const rule = rules.find((r) => r.selector === root);
      return rule && new Map(rule.decls).get("z-index");
    });
    for (const value of zIndex) expect(value).toMatch(/^\d+$/);
    const [grid, inspector, toolbar] = zIndex.map(Number);
    expect(grid).toBeLessThan(inspector);
    expect(inspector).toBeLessThan(toolbar);
  }, 30_000);
});
