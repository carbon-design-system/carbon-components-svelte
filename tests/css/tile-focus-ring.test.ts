// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("selectable tile focus ring", () => {
  it("covers the edge shared with the neighboring tile", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const focus = rules.find(
      (r) => r.selector === ".bx--tile-input:focus+.bx--tile" && !r.context,
    );
    const selectable = rules.filter(
      (r) => r.selector === ".bx--tile--selectable" && !r.context,
    );

    // A 2px ring at -1px reaches 1px past the tile, over the neighbor's
    // 1px border, instead of sitting inset beside it.
    expect(focus?.decls.get("outline")).toMatch(/^2px /);
    expect(focus?.decls.get("outline-offset")).toBe("-1px");
    // Paints above the next tile, which comes later in the DOM.
    expect(focus?.decls.get("z-index")).toBe("1");
    expect(selectable.some((r) => r.decls.get("position") === "relative")).toBe(
      true,
    );
  }, 30_000);
});
