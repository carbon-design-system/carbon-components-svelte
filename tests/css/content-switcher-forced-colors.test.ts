// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// The selected switch is a background fill, which forced-colors mode
// repaints, so selected and unselected switches looked identical.
describe("content switcher selection in forced colors", () => {
  it("paints the selected switch with Highlight", async () => {
    const css = await compileEntry("white.scss");
    const rules = parseRules(css).filter(
      (r) =>
        r.context.includes("forced-colors") &&
        r.selector.includes(".bx--content-switcher--selected"),
    );
    expect(
      rules.some(
        (r) =>
          r.decls.get("forced-color-adjust") === "none" &&
          r.decls.get("background-color") === "Highlight" &&
          r.decls.get("color") === "HighlightText",
      ),
    ).toBe(true);
  }, 30_000);

  // `forced-color-adjust: none` restores the real focus ring, and the
  // high-contrast `Highlight` outline sits on the `Highlight` fill, so a
  // focused selected switch gets a contrasting system-colour ring instead.
  it("rings a focused selected switch with a contrasting system colour", async () => {
    const css = await compileEntry("white.scss");
    const rules = parseRules(css).filter((r) =>
      r.context.includes("forced-colors"),
    );
    const focused = rules.filter((r) =>
      r.selector.endsWith(
        ".bx--content-switcher--selected:not(:disabled):focus",
      ),
    );
    expect(
      focused.some(
        (r) =>
          r.decls.get("outline") === "2px solid HighlightText" &&
          r.decls.get("outline-offset") === "-4px" &&
          r.decls.get("box-shadow") === "none",
      ),
    ).toBe(true);
    const overlay = rules.filter((r) =>
      r.selector.endsWith(
        ".bx--content-switcher--selected:not(:disabled):focus::after",
      ),
    );
    expect(overlay.some((r) => r.decls.get("box-shadow") === "none")).toBe(
      true,
    );
  }, 30_000);
});
