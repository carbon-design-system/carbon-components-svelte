import { join } from "node:path";
import { compileAsync } from "sass-embedded";
import { parseRules } from "../../scripts/lib/css-cascade";

const CSS_DIR = join(__dirname, "../../css");

describe("all.scss theme tokens", () => {
  it("non-default themes only re-declare tokens that differ from :root", async () => {
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
    const tokens = (selector: string) => {
      const rule = parseRules(css).find(
        (r) => r.selector === selector && r.context === "",
      );
      return new Map(
        [...(rule?.decls ?? [])].filter(([prop]) => prop.startsWith("--cds-")),
      );
    };
    const root = tokens(":root");
    expect(root.size).toBeGreaterThan(400);

    for (const theme of ["g10", "g80", "g90", "g100"]) {
      const declared = tokens(`:root[theme=${theme}]`);
      const redundant = [...declared].filter(
        ([token, value]) => root.get(token) === value,
      );
      expect(declared.size, theme).toBeGreaterThan(0);
      expect(redundant, theme).toEqual([]);
      // Theme independent tokens (type, spacing, layout) come from `:root`.
      expect(declared.has("--cds-spacing-05"), theme).toBe(false);
      expect(root.has("--cds-spacing-05")).toBe(true);
    }
  }, 30_000);
});
