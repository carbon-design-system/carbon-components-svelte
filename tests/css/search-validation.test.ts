// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

describe("search validation messages", () => {
  it.each(["data-invalid", "data-warn"])(
    "reveals the form requirement after a [%s] search",
    async (attr) => {
      // `.bx--form-requirement` is `display: none` until a sibling rule
      // reveals it, and v10's list of field wrappers omits `.bx--search`.
      const css = await compileEntry("white.scss");
      const reveal = parseRules(css).filter(
        (r) =>
          r.selector.includes(`search[${attr}]`) &&
          r.selector.endsWith("form-requirement") &&
          r.decls.get("display") === "block",
      );
      expect(reveal.length).toBeGreaterThan(0);
    },
    30_000,
  );
});
