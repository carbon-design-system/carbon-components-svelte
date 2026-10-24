// @vitest-environment node
import { compileEntry } from "./compile";

describe("tooltip trigger width", () => {
  it("keeps stretching parents from widening tooltip wrappers", async () => {
    // A vertical Stack (align="stretch") or any grid widened the definition
    // wrapper and the TooltipIcon button to the parent's width, so their
    // tooltips centered on the stretched box instead of the term or icon.
    const css = await compileEntry("all.scss");
    for (const selector of [
      ".bx--tooltip--definition.bx--tooltip--a11y",
      ".bx--tooltip__trigger:not(.bx--btn--icon-only)",
    ]) {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const blocks = [
        ...css.matchAll(
          new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`, "g"),
        ),
      ].map((match) => match[1]);
      expect(blocks.join(""), selector).toMatch(/width:\s*fit-content/);
    }
  }, 30_000);
});
