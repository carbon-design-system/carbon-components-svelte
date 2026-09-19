import { join } from "node:path";
import { compileAsync } from "sass-embedded";

const CSS_DIR = join(__dirname, "../../css");

describe("any-hover media query grouping", () => {
  it("does not regress back to one block per hover rule", async () => {
    const { css } = await compileAsync(join(CSS_DIR, "all.scss"), {
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
    // Adjacent `(any-hover: hover)` rules should share one @media block per
    // component (more only where moving a hover rule would reorder the
    // cascade) rather than opening a new block per rule.
    const blocks = css.match(/@media\(any-hover: hover\)\{/g) ?? [];
    expect(blocks.length).toBeLessThanOrEqual(55);
  }, 30_000);
});
