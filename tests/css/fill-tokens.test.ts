// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// Box `fill` and ScrollGradient `color` names are Carbon v11 tokens, so each
// one paints with the token of the same name.
describe("fill tokens", () => {
  const fills = ["background", "layer-01", "layer-02", "layer-03"];

  it.each(fills)(
    "Box fill %s reads the %s token",
    async (name) => {
      const rules = parseRules(await compileEntry("all.scss"));
      const rule = rules.find((r) => r.selector === `.bx--box-fill-${name}`);
      expect(rule?.decls.get("background-color")).toBe(`var(--cds-${name})`);
    },
    30_000,
  );

  // These names differ from, or add to, the token they paint with.
  it.each([
    ["layer-accent", "layer-accent"],
    ["field", "field-01"],
    ["inverse", "background-inverse"],
    ["brand", "background-brand"],
  ])(
    "Box fill %s reads the %s token",
    async (name, token) => {
      const rules = parseRules(await compileEntry("all.scss"));
      const rule = rules.find((r) => r.selector === `.bx--box-fill-${name}`);
      expect(rule?.decls.get("background-color")).toBe(`var(--cds-${token})`);
    },
    30_000,
  );

  it.each(fills)(
    "ScrollGradient color %s reads the %s token",
    async (name) => {
      const rules = parseRules(await compileEntry("all.scss"));
      const rule = rules.find(
        (r) => r.selector === `.bx--scroll-gradient--color-${name}`,
      );
      expect(rule?.decls.get("--cds-scroll-gradient-color")).toBe(
        `var(--cds-${name})`,
      );
    },
    30_000,
  );
});
