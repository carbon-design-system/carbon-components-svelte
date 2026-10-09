// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("operational tag", () => {
  it("rings the tag in its own text color, focused or not", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    const rule = (selector: string) =>
      rules.find((r) => r.selector === selector && r.context === "");

    expect(rule(".bx--tag--operational")?.decls.get("box-shadow")).toBe(
      "inset 0 0 0 1px currentColor",
    );
    const focus = rule(".bx--tag--operational:focus");
    expect(focus?.decls.get("box-shadow")).toBe("inset 0 0 0 1px currentColor");
    expect(focus?.decls.get("outline")).toBe("2px solid var(--cds-focus)");
  }, 30_000);

  it("rings the gray types in a neutral border, unlike SelectableTag", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    for (const type of ["gray", "cool-gray", "warm-gray"]) {
      const rule = rules.find(
        (r) =>
          r.selector === `.bx--tag--operational.bx--tag--${type}` &&
          r.context === "",
      );
      expect(rule?.decls.get("box-shadow")).toBe(
        "inset 0 0 0 1px var(--cds-ui-04)",
      );
    }
  }, 30_000);
});
