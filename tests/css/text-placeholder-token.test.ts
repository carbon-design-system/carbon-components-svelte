// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("text-placeholder token", () => {
  // Components draw placeholders in `text-helper` (v10 `text-05`);
  // `text-placeholder` (and `.bx--type-text-placeholder`) names the same
  // color. It was `text-03`, the gray v10 replaced for contrast: 2.3:1 on a
  // white field.
  it.each([
    ":root",
    ":root[theme=g10]",
    ":root[theme=g80]",
    ":root[theme=g90]",
    ":root[theme=g100]",
  ])(
    "%s gives text-placeholder text-helper's value",
    async (selector) => {
      const rules = parseRules(await compileEntry("all.scss"));
      // A theme block declares only what differs from `:root`.
      const token = (name: string) =>
        [selector, ":root"]
          .map((s) => rules.find((r) => r.selector === s && r.decls.has(name)))
          .find(Boolean)
          ?.decls.get(name);
      expect(token("--cds-text-placeholder")).toBe(token("--cds-text-helper"));
    },
    30_000,
  );
});
