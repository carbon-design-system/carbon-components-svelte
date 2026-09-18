import { join } from "node:path";
import { compileAsync } from "sass-embedded";
import { deadDeclarations } from "../../scripts/lib/css-overrides";

const CSS_DIR = join(__dirname, "../../css");

describe("css overrides", () => {
  it("all.scss emits no declaration that can never win", async () => {
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
    const dead = deadDeclarations(css).map(
      (d) => `${d.selector} { ${d.property}: ${d.value} }`,
    );
    // `bun run check:css:overrides` lists each with its scss source.
    expect(dead).toEqual([]);
  }, 30_000);
});
