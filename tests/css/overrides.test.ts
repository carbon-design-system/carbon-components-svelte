import { join } from "node:path";
import { compileAsync } from "sass-embedded";
import { deadDeclarations } from "../../scripts/lib/css-overrides";

const CSS_DIR = join(__dirname, "../../css");

// `white.scss` too: a static theme compiles the token branches all.scss
// replaces with `var()`, and skips the `$ccs-theme-switching` scopes.
describe("css overrides", () => {
  it.each(["all.scss", "white.scss"])(
    "%s emits no declaration that can never win",
    async (entry) => {
      const { css } = await compileAsync(join(CSS_DIR, entry), {
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
    },
    60_000,
  );
});
