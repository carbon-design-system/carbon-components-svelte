import { join } from "node:path";
import { compileAsync } from "sass-embedded";
import { parseRules } from "../../scripts/lib/css-cascade";

const CSS_DIR = join(__dirname, "../../css");

describe("fluid text area focus ring", () => {
  it("uses a positioned ::after box-shadow, not outline, so the ring is not clipped by or painted under the invalid/warn footer", async () => {
    // Chromium clips `outline` to a stale rect once `.form-requirement` (a
    // `position: relative` child) is present in the initial paint; a plain
    // `box-shadow` on the wrapper avoids that but paints under normal-flow
    // children, so the divider/footer (flush to the wrapper's edges)
    // interrupt it. A positioned `::after` overlay paints above them.
    // `prefers-contrast` still gets a real outline, since box-shadow is
    // dropped in forced-colors mode.
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
    const ring = rules.filter(
      (r) =>
        r.selector.includes("text-area__wrapper") &&
        r.selector.endsWith(":focus-within::after"),
    );
    expect(ring.length).toBeGreaterThan(0);

    const outsideContrast = ring.filter(
      (r) => !r.context.includes("prefers-contrast"),
    );
    expect(
      outsideContrast.every((r) => r.decls.get("position") === "absolute"),
    ).toBe(true);
    expect(outsideContrast.every((r) => r.decls.has("box-shadow"))).toBe(true);
    expect(outsideContrast.some((r) => r.decls.has("outline"))).toBe(false);

    const insideContrast = ring.filter((r) =>
      r.context.includes("prefers-contrast"),
    );
    expect(insideContrast.length).toBeGreaterThan(0);
    expect(insideContrast.every((r) => r.decls.has("outline"))).toBe(true);
  }, 30_000);

  it("reserves the invalid border at rest and on focus so the wrapper does not resize", async () => {
    // `:not(:focus-within) { border: 2px solid ... }` alone reverts to a 0px
    // border on focus, shrinking the wrapper's border-box height by 4px.
    // The border must stay 2px in both states; only the color toggles.
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
    const always = rules.find(
      (r) =>
        r.selector ===
          ".bx--text-area--fluid .bx--text-area__wrapper[data-invalid]" &&
        r.context === "",
    );
    expect(always?.decls.get("border")).toBe("2px solid transparent");

    const atRest = rules.find(
      (r) =>
        r.selector ===
          ".bx--text-area--fluid .bx--text-area__wrapper[data-invalid]:not(:focus-within)" &&
        r.context === "",
    );
    expect(atRest?.decls.has("border")).toBe(false);
    expect(atRest?.decls.has("border-color")).toBe(true);
  }, 30_000);

  it("reserves a transparent 1px warn border instead of none, so focus does not grow the wrapper", async () => {
    // `.text-area--fluid .text-area:focus` unconditionally sets
    // `border-block-end: 1px solid transparent` (0,3,0), beating the warn
    // textarea's own rule (0,2,0). If that rule sets `border-block-end:
    // none` (0px) instead of a transparent 1px, the wrapper is 1px shorter
    // at rest than once focused.
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
    const warning = rules.find(
      (r) =>
        r.selector === ".bx--text-area--fluid .bx--text-area--warning" &&
        r.context === "" &&
        r.decls.has("border-block-end"),
    );
    expect(warning?.decls.get("border-block-end")).toBe(
      "1px solid transparent",
    );
  }, 30_000);
});
