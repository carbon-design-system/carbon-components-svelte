// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

describe("disabled selected tile", () => {
  it("mutes the selected border instead of drawing a second outline", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const selected = rules.find(
      (r) => r.selector === ".bx--tile--is-selected" && !r.context,
    );
    const disabledSelected = rules.find(
      (r) => r.selector === ".bx--tile--disabled.bx--tile--is-selected",
    );
    const disabledCheckmark = rules.find(
      (r) =>
        r.selector ===
        ".bx--tile--disabled.bx--tile--is-selected .bx--tile__checkmark svg",
    );

    expect(selected?.decls.get("border")).toMatch(/^1px solid /);
    // Same muted color as the disabled checkmark.
    expect(disabledSelected?.decls.get("border-color")).toBe(
      disabledCheckmark?.decls.get("fill"),
    );
    // The base tile's transparent 2px outline must stay transparent, or it
    // draws inside the 1px border as a double border.
    expect(disabledSelected?.decls.has("outline-color")).toBe(false);
    expect(disabledSelected?.specificity).toEqual([0, 2, 0]);
  }, 30_000);
});
