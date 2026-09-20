import { deadDeclarations } from "../../scripts/lib/css-overrides";
import { compileEntry } from "./compile";

// `white.scss` too: a static theme compiles the token branches all.scss
// replaces with `var()`, and skips the `$ccs-theme-switching` scopes.
describe("css overrides", () => {
  it.each(["all.scss", "white.scss"])(
    "%s emits no declaration that can never win",
    async (entry) => {
      const css = await compileEntry(entry);
      const dead = deadDeclarations(css).map(
        (d) => `${d.selector} { ${d.property}: ${d.value} }`,
      );
      // `bun run check:css:overrides` lists each with its scss source.
      expect(dead).toEqual([]);
    },
    60_000,
  );
});
