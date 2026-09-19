import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(
    __dirname,
    "../../css/vendor/carbon-components/scss/components/date-picker/_flatpickr.scss",
  ),
  "utf8",
);

describe("date picker week numbers", () => {
  it("lays the week column out beside the day grid", () => {
    // flatpickr's `weekNumbers` option adds a `.flatpickr-weekwrapper`
    // sibling before the day grid. Without a flex row it stacked on top of
    // the 288px calendar and pushed the days out of the clipped container.
    expect(source).toMatch(/\.flatpickr-innerContainer \{[^}]*display: flex;/);
    expect(source).toMatch(/\.flatpickr-calendar\.hasWeeks\.open \{[^}]*width:/);
    expect(source).toMatch(/\.flatpickr-weekwrapper \.flatpickr-weeks \{/);
  });

  it("overrides the inline widths flatpickr measures while hidden", () => {
    // flatpickr sets `style.width` on the calendar and days container from
    // a hidden-state measurement that is 4px short, wrapping at six columns.
    expect(source).toMatch(
      /\.flatpickr-calendar\.hasWeeks\.open \{\s*width: [^;]+ !important;/,
    );
    expect(source).toMatch(
      /\.flatpickr-calendar\.hasWeeks \.flatpickr-days \{\s*width: 100% !important;/,
    );
  });
});
