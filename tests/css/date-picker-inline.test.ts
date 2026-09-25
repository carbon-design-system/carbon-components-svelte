// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(
    __dirname,
    "../../css/vendor/carbon-components/scss/components/date-picker/_flatpickr.scss",
  ),
  "utf8",
);

describe("date picker inline calendar", () => {
  it("sizes and fills the inline calendar like the open popup", () => {
    // An inline calendar never gets `.open`, which carried the 288px width,
    // padding, and surface color. Without them it fell back to the 315px
    // base width on a transparent background.
    const rule = source.match(
      /\.flatpickr-calendar\.inline \{\s*position: relative;[^}]*\}/,
    )?.[0];
    expect(rule).toBeDefined();
    expect(rule).toMatch(/width: to-rem\(288px\);/);
    expect(rule).toMatch(/background-color: \$ui-01;/);
  });
});
