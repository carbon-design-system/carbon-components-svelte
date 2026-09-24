import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(
    __dirname,
    "../../css/vendor/carbon-components/scss/components/date-picker/_date-picker.scss",
  ),
  "utf8",
);

describe("date picker week grid", () => {
  it("gives the days between a week's ends the in-range look", () => {
    // flatpickr's week plugin marks all seven days `.week.selected`.
    expect(source).toMatch(
      /\.flatpickr-day\.week\.selected:not\(:nth-child\(7n \+ 1\)\):not\(:nth-child\(7n\)\) \{\s*color: \$text-01;\s*background-color: \$highlight;/,
    );
  });
});
