// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// Layer re-points each contextual token to its numbered token for the
// level, as @carbon/styles does. border-subtle starts at -00.
describe("Layer tokens", () => {
  it.each([
    ["one", "--cds-layer", "var(--cds-layer-01)"],
    ["two", "--cds-layer", "var(--cds-layer-02)"],
    ["three", "--cds-field", "var(--cds-field-03)"],
    ["one", "--cds-border-subtle", "var(--cds-border-subtle-00)"],
    ["two", "--cds-border-subtle", "var(--cds-border-subtle-01)"],
    ["three", "--cds-border-strong", "var(--cds-border-strong-03)"],
  ])(
    ".bx--layer-%s sets %s to %s",
    async (level, prop, value) => {
      const rules = parseRules(await compileEntry("all.scss"));
      const rule = rules.find((r) => r.selector === `.bx--layer-${level}`);
      expect(rule?.decls.get(prop)).toBe(value);
    },
    30_000,
  );

  // The single-theme files declare no tokens on :root, so components read
  // contextual tokens with the compiled value as a fallback, and a Layer
  // can still re-point them.
  it("reads contextual tokens through var() in single-theme files", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const tile = rules.find((r) => r.selector === ".bx--tile");
    expect(tile?.decls.get("background-color")).toBe(
      "var(--cds-layer,#f4f4f4)",
    );
    const layer = rules.find((r) => r.selector === ".bx--layer-two");
    expect(layer?.decls.get("--cds-layer")).toBe("#ffffff");
  }, 30_000);
});
