// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("table of contents focus", () => {
  it("outlines a link on keyboard focus but not on click", async () => {
    const selectors = parseRules(await compileEntry("all.scss"))
      .filter((r) => r.decls.has("outline"))
      .map((r) => r.selector)
      .filter((s) => s.includes("bx--toc__link"));

    expect(selectors).toContain(".bx--toc__link:focus-visible");
    expect(selectors).not.toContain(".bx--toc__link:focus");
  }, 30_000);
});
