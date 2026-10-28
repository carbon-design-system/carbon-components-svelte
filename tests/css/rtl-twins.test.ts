// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// A `[dir="rtl"]` twin matches any RTL ancestor, so it also matches inside
// a `dir="ltr"` region in an RTL page. Each value in a twin reads the
// nearest `dir` through `ccs-dir()` (`--ccs-ltr`) or `--ccs-mirror-rtl`.
// A plain value keeps that region on its RTL side while its logical
// padding follows LTR, which put PasswordInput's toggle over its text.
const NEAREST_DIR = /var\(--ccs-(ltr|mirror-rtl),/;

// Twins whose value is the same in both directions.
const SAME_BOTH_WAYS = new Set([
  "[dir=rtl] .bx--snippet--multi.bx--snippet--no-copy .bx--snippet-container pre padding-left",
  "[dir=rtl] .bx--list-box--decorator .bx--list-box__selection--multi left",
  "[dir=rtl] .bx--list-box--decorator .bx--list-box__selection--multi right",
]);

describe("[dir=rtl] twins", () => {
  it("read the nearest dir", async () => {
    const decls = parseRules(await compileEntry("all.scss"))
      .filter((rule) => /\[dir=rtl\][\s>+~]/.test(rule.selector))
      .flatMap((rule) =>
        [...rule.decls].map(([property, value]) => ({
          name: `${rule.selector} ${property}`,
          value,
        })),
      );

    expect(decls.length).toBeGreaterThan(300);
    expect(
      decls
        .filter(({ value }) => !NEAREST_DIR.test(value))
        .filter(({ name }) => !SAME_BOTH_WAYS.has(name))
        .map(({ name, value }) => `${name}: ${value}`),
    ).toEqual([]);
  }, 30_000);
});

// `ccs-dir()` expands to `var(--ccs-rtl, $ltr) var(--ccs-ltr, $rtl)`. Only
// a `[dir]` element sets those switches, so on a page with no `dir` both
// fall back, and a base rule gets both values at once. Two transforms
// cancel: that held every checked Toggle handle at the start (#5190).
const DIR_SWITCH = /var\(--ccs-(rtl|ltr)\b/;
const RTL_QUALIFIER = /\[dir=rtl\]|:dir\(rtl\)/;

describe("ccs-dir()", () => {
  it.each(["all.scss", "white.scss"])(
    "only appears in a [dir=rtl] twin in %s",
    async (entry) => {
      const rules = parseRules(await compileEntry(entry)).filter((rule) =>
        [...rule.decls.values()].some((value) => DIR_SWITCH.test(value)),
      );

      expect(rules.length).toBeGreaterThan(200);
      expect(
        rules
          .filter(
            (rule) =>
              !RTL_QUALIFIER.test(rule.selector.replace(/:not\([^)]*\)/g, "")),
          )
          .flatMap((rule) =>
            [...rule.decls]
              .filter(([, value]) => DIR_SWITCH.test(value))
              .map(
                ([property, value]) => `${rule.selector} ${property}: ${value}`,
              ),
          ),
      ).toEqual([]);
    },
    30_000,
  );
});
