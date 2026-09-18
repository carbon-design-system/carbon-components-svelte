import { join } from "node:path";
import { compileAsync } from "sass-embedded";

const CSS_DIR = join(__dirname, "../../css");

const compile = (entry: string) =>
  compileAsync(join(CSS_DIR, entry), {
    style: "compressed",
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

describe("all.scss token fallbacks", () => {
  it("omits var() fallbacks only for tokens the stylesheet declares", async () => {
    const { css } = await compile("all.scss");
    const declared = new Set(
      [...css.matchAll(/[{;](--cds-[\w-]+):/g)].map((m) => m[1]),
    );
    const bare = new Set(
      [...css.matchAll(/var\((--cds-[\w-]+)\)/g)].map((m) => m[1]),
    );
    expect(bare.size).toBeGreaterThan(200);
    expect([...bare].filter((token) => !declared.has(token))).toEqual([]);

    // Generated token references carry no static fallback any more.
    expect(css).not.toMatch(/var\(--cds-spacing-05,/);
    expect(css).not.toMatch(/var\(--cds-body-short-01-font-size,/);
  }, 30_000);
});
