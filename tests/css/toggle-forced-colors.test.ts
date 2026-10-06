// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

describe("toggle focus ring in forced colors", () => {
  it("draws a system-colour outline on the focused switch", async () => {
    // The default ring is a box-shadow, which forced-colors mode drops.
    const css = await compileEntry("white.scss");
    const ring = parseRules(css).filter(
      (r) =>
        r.context.includes("forced-colors") &&
        r.selector.includes(".bx--toggle-input:focus") &&
        r.selector.includes(".bx--toggle__switch::before"),
    );

    expect(ring.length).toBeGreaterThan(0);
    // The unfocused switch already has a 1px outline, so the focused ring
    // must be thicker and offset to be distinguishable.
    expect(
      ring.some(
        (r) =>
          r.decls.get("outline") === "2px solid Highlight" &&
          r.decls.get("outline-offset") === "2px",
      ),
    ).toBe(true);
  }, 30_000);
});
