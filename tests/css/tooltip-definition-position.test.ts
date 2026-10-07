import { readFileSync } from "node:fs";
import { join } from "node:path";

const FILE = join(
  __dirname,
  "../../css/vendor/carbon-components/scss/components/tooltip/_tooltip.scss",
);

describe("tooltip definition wrapper", () => {
  it("is the positioning context for its inline tooltip", () => {
    // The tooltip is a sibling of the trigger, absolutely positioned. With
    // a static wrapper it resolved against the page and rendered far from
    // the term.
    const css = readFileSync(FILE, "utf8");
    const rule = css.match(
      /\.#\{\$prefix\}--tooltip--definition\.#\{\$prefix\}--tooltip--a11y \{([^}]*)\}/,
    );
    expect(rule?.[1]).toMatch(/position: relative;/);
  });
});
