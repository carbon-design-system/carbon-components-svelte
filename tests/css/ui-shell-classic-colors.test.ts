// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("UI shell header colors", () => {
  // What inherits the header's text color (an icon-only action's
  // `currentColor` icon on hover) follows the header's theme, not the
  // page's, so it stays light on a classic Gray 100 header.
  it("sets the header's own text color", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    const header = rules.find(
      (r) => r.selector === ".bx--header" && r.decls.has("background-color"),
    );
    // `$shell-header-text-01`; a classic header re-declares the token.
    expect(header?.decls.get("color")).toBe("var(--cds-text-primary)");
  }, 30_000);

  // Header tooltips open over the page, so a classic header's tooltips use
  // the page's inverse colors, captured at the root before the header
  // re-declares them.
  it("gives classic header tooltips the page's inverse colors", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    const root = rules.find((r) => r.decls.has("--ccs-page-inverse-01"));
    expect(root?.selector).toBe("html");
    const tooltip = rules.find(
      (r) =>
        r.selector.includes(".bx--header--ui-shell-classic") &&
        r.selector.includes(".bx--tooltip__trigger"),
    );
    expect(tooltip?.decls.get("--cds-inverse-01")).toBe(
      "var(--ccs-page-inverse-01)",
    );
    expect(tooltip?.decls.get("--cds-inverse-02")).toBe(
      "var(--ccs-page-inverse-02)",
    );
  }, 30_000);
});
