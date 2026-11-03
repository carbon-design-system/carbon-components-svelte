// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// The "Copied!" confirmation fades in on the entrance curve and out on the
// exit curve, at fast-02 (110 ms). It fades the inline caret, the code
// snippet's and the portalled tooltip alike, and swaps at once under
// reduced motion.
const FADE_IN = /^110ms cubic-bezier\(0,0,0\.38,0\.9\) show-feedback$/;
const FADE_OUT =
  /^110ms cubic-bezier\(0\.2,0,1,0\.9\) hide-feedback( forwards)?$/;
const REDUCED = "@media (prefers-reduced-motion:reduce)";

const SELECTORS = {
  fadeIn: [
    ".bx--copy-btn.bx--copy-btn--animating.bx--copy-btn--fade-in .bx--copy-btn__feedback",
    ".bx--snippet--inline.bx--copy-btn--animating.bx--copy-btn--fade-in .bx--copy-btn__feedback",
    ".bx--tooltip-portal--fade-in",
  ],
  fadeOut: [
    ".bx--copy-btn.bx--copy-btn--animating.bx--copy-btn--fade-out .bx--copy-btn__feedback",
    ".bx--snippet--inline.bx--copy-btn--animating.bx--copy-btn--fade-out .bx--copy-btn__feedback",
    ".bx--tooltip-portal--fade-out",
  ],
};

describe("copy feedback motion", () => {
  let rules: ReturnType<typeof parseRules> = [];
  beforeAll(async () => {
    rules = parseRules(await compileEntry("all.scss"));
  }, 30_000);

  const animation = (selector: string, context = "") =>
    rules
      .filter((r) => r.selector === selector && r.context === context)
      .map((r) => r.decls.get("animation"))
      .findLast(Boolean);

  it.each(SELECTORS.fadeIn)("%s fades in on the entrance curve", (selector) => {
    expect(animation(selector)).toMatch(FADE_IN);
  });

  it.each(SELECTORS.fadeOut)("%s fades out on the exit curve", (selector) => {
    expect(animation(selector)).toMatch(FADE_OUT);
  });

  it.each([...SELECTORS.fadeIn, ...SELECTORS.fadeOut])(
    "%s does not animate under reduced motion",
    (selector) => {
      expect(animation(selector, REDUCED)).toBe("none");
    },
  );
});
