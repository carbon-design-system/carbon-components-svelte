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
