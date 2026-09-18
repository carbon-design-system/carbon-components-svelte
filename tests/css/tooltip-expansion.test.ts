import { join } from "node:path";
import { compileAsync } from "sass-embedded";
import { parseRules } from "../../scripts/lib/css-cascade";

const CSS_DIR = join(__dirname, "../../css");

describe("css-only tooltip mixins", () => {
  it("emit the shared show/hide state once, not per direction", async () => {
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
    const hidden = new Set(
      parseRules(css)
        .filter((rule) => rule.selector.includes(".bx--tooltip--hidden"))
        .filter((rule) => !rule.selector.includes(":not(.bx--tooltip--hidden)"))
        .map((rule) => rule.selector.replace(/(::before| \S+|\+\S+)$/, "")),
    );
    expect([...hidden].sort()).toEqual([
      ".bx--tooltip__trigger.bx--tooltip--a11y.bx--tooltip--hidden",
      ".bx--tooltip__trigger.bx--tooltip--a11y.bx--tooltip--hidden.bx--tooltip--a11y",
    ]);
  }, 30_000);
});
