// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// Layer re-points each contextual token to its numbered token for the
// level, as @carbon/styles does. border-subtle starts at -00.
describe("Layer tokens", () => {
  it.each([
    ["one", "--cds-layer", "var(--cds-layer-01)"],
    ["two", "--cds-layer", "var(--cds-layer-02)"],
    ["three", "--cds-field", "var(--cds-field-03)"],
    ["one", "--cds-border-subtle", "var(--cds-border-subtle-00)"],
    ["two", "--cds-border-subtle", "var(--cds-border-subtle-01)"],
    ["three", "--cds-border-strong", "var(--cds-border-strong-03)"],
  ])(
    ".bx--layer-%s sets %s to %s",
    async (level, prop, value) => {
      const rules = parseRules(await compileEntry("all.scss"));
      const rule = rules.find((r) => r.selector === `.bx--layer-${level}`);
      expect(rule?.decls.get(prop)).toBe(value);
    },
    30_000,
  );

  // A numbered token (layer-01, field-02, ...) stays on one surface however
  // deep the Layer, so components read the contextual name. Each entry
  // below pins a level on purpose; @carbon/styles v11 pins the same ones
  // unless noted.
  const PINNED: [selector: RegExp, token: string, why: string][] = [
    [/^\.bx--box-fill-layer-0\d$/, "layer-0", "the fill names the level"],
    [/^\.bx--scroll-gradient\S*layer-0\d$/, "layer-0", "the color names it"],
    [/^\.bx--data-table \S/, "field-02", "fields in a table"],
    [/--inline\.bx--list-box--expanded:hover$/, "field-02", "v11: transparent"],
    [/^\.bx--content-switcher--low-contrast /, "layer-02", "fixed per theme"],
    [/^\.bx--date-picker__day\S*--selected:focus/, "layer-02", "focus inset"],
    [/^\.bx--toggle-input:(focus|active)\+/, "layer-02", "v11: no gap"],
  ];
  const NUMBERED =
    /var\(--cds-((?:layer|field|border-(?:subtle|strong|tile))[a-z-]*-0[0-3])\)/g;

  it("reads numbered layer tokens only where a level is pinned", async () => {
    const reads = parseRules(await compileEntry("all.scss")).flatMap((rule) =>
      [...rule.decls]
        // Skip the theme and Layer blocks that define the tokens.
        .filter(([prop]) => !/^--cds-(layer|field|border-)/.test(prop))
        .flatMap(([, value]) =>
          [...value.matchAll(NUMBERED)].map(([, token]) => ({
            selector: rule.selector,
            token,
          })),
        ),
    );
    const unpinned = reads.filter(
      ({ selector, token }) =>
        !PINNED.some(([re, t]) => re.test(selector) && token.startsWith(t)),
    );
    const unused = PINNED.filter(
      ([re, t]) =>
        !reads.some(
          ({ selector, token }) => re.test(selector) && token.startsWith(t),
        ),
    );

    expect(reads.length).toBeGreaterThan(20);
    expect(unpinned).toEqual([]);
    expect(unused.map(([, , why]) => why)).toEqual([]);
  }, 30_000);

  // v11 draws zebra stripes with layer-accent. It steps up with the Layer
  // as the rows do, so the stripes stay visible at every level.
  it("draws every zebra stripe with layer-accent", async () => {
    const stripes = parseRules(await compileEntry("all.scss")).filter(
      (rule) =>
        /zebra/.test(rule.selector) &&
        !/:hover|selected|highlighted|--hover/.test(rule.selector) &&
        rule.decls.has("background-color"),
    );

    // Flat rows, expanded parent and child rows, and filterMode="hide".
    expect(stripes).toHaveLength(4);
    for (const { selector, decls } of stripes) {
      for (const prop of ["background-color", "border-top", "border-bottom"]) {
        expect(decls.get(prop), `${selector} ${prop}`).toMatch(
          /var\(--cds-layer-accent\)$/,
        );
      }
    }
  }, 30_000);

  // The single-theme files declare no tokens on :root, so components read
  // contextual tokens with the compiled value as a fallback, and a Layer
  // can still re-point them.
  it("reads contextual tokens through var() in single-theme files", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const tile = rules.find((r) => r.selector === ".bx--tile");
    expect(tile?.decls.get("background-color")).toBe(
      "var(--cds-layer,#f4f4f4)",
    );
    const layer = rules.find((r) => r.selector === ".bx--layer-two");
    expect(layer?.decls.get("--cds-layer")).toBe("#ffffff");
  }, 30_000);
});
