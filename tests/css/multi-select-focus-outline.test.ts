// @vitest-environment node
// @depends-on css/vendor/carbon-components/scss/components/multi-select/_multi-select.scss
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(
    __dirname,
    "../../css/vendor/carbon-components/scss/components/multi-select/_multi-select.scss",
  ),
  "utf8",
);

describe("multi-select focus outline", () => {
  it("positions the field wrapper that draws the focus outline", () => {
    // Unpositioned, the wrapper's inset outline painted under the positioned
    // field inside it, so an invalid multi-select kept its red outline while
    // focused.
    const rule = source.match(
      /--multi-select \.#\{\$prefix\}--list-box__field--wrapper \{([^}]*)\}/,
    );
    expect(rule?.[1]).toMatch(/position: relative;/);
  });
});
