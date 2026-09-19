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
    // Grouped adjacent `(any-hover: hover)` rules per component close one
    // @media block instead of N. Was 72 blocks before grouping (see
    // .context/css-size-followup-results.md); this caps well below that so
    // a future change re-scattering the blocks gets caught.
    const blocks = css.match(/@media\(any-hover: hover\)\{/g) ?? [];
    expect(blocks.length).toBeLessThanOrEqual(40);
  }, 30_000);
});
