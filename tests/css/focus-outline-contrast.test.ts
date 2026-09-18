import { join } from "node:path";
import { compileAsync } from "sass-embedded";
import { parseRules } from "../../scripts/lib/css-cascade";

const CSS_DIR = join(__dirname, "../../css");

describe("focus outline under prefers-contrast", () => {
  it("switches to dotted through one :root custom property", async () => {
    const { css } = await compileAsync(join(CSS_DIR, "white.scss"), {
      loadPaths: [join(CSS_DIR, "vendor")],
      quietDeps: true,
      silenceDeprecations: [
        "import",
        "global-builtin",
        "color-functions",
        "if-function",
      ],
      logger: { warn() {}, debug() {} },
    });
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
