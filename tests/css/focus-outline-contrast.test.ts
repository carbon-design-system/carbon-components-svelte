// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

describe("focus outline under prefers-contrast", () => {
  it("switches to dotted through one :root custom property", async () => {
    const css = await compileEntry("white.scss");
    const rules = parseRules(css);
    const contrast = rules.filter((r) =>
      r.context.includes("prefers-contrast"),
    );

    expect(
      contrast.filter((r) => r.decls.has("--cds-focus-outline-style")),
    ).toMatchObject([{ selector: ":root" }]);
    expect(contrast.filter((r) => r.decls.has("outline-style"))).toEqual([]);

    expect(css).toContain("var(--cds-focus-outline-style, solid)");
  }, 30_000);
});
