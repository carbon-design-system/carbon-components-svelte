// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

describe("tile type", () => {
  // Without a type style, tile text inherited the reset's `line-height: 1`,
  // so only ClickableTile (which sets one) read at body line height.
  it(".bx--tile sets body-short-01 line height", async () => {
    const tile = parseRules(await compileEntry("all.scss")).find(
      (r) => r.selector === ".bx--tile" && r.context === "",
    );
    expect(tile?.decls.get("line-height")).toBe(
      "var(--cds-body-short-01-line-height)",
    );
    expect(tile?.decls.get("font-size")).toBe(
      "var(--cds-body-short-01-font-size)",
    );
  }, 30_000);
});
