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
    const root = rules.find((r) => r.decls.has("--ccs-page-text-inverse"));
    expect(root?.selector).toBe("html");
    const tooltip = rules.find(
      (r) =>
        r.selector.includes(".bx--header--ui-shell-classic") &&
        r.selector.includes(".bx--tooltip__trigger"),
    );
    expect(tooltip?.decls.get("--cds-text-inverse")).toBe(
      "var(--ccs-page-text-inverse)",
    );
    expect(tooltip?.decls.get("--cds-background-inverse")).toBe(
      "var(--ccs-page-background-inverse)",
    );
    // The override only works if the tooltip reads the tokens it re-declares.
    const reads = rules
      .filter((r) => r.selector.includes(".bx--tooltip__trigger"))
      .flatMap((r) => [...r.decls.values()]);
    expect(reads).toContain("var(--cds-background-inverse)");
    expect(reads).toContain("var(--cds-text-inverse)");
  }, 30_000);
});
