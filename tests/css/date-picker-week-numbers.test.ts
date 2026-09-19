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
    expect(source).toMatch(/\.flatpickr-weekwrapper \.flatpickr-weeks \{/);
  });

  it("keeps the padding outside the inline widths flatpickr sets", () => {
    // For `weekNumbers` and `showMonths` flatpickr writes `style.width` as
    // months + week column, a content width. Under `border-box` the 8px of
    // padding came out of it and the day grid wrapped at six columns.
    expect(source).toMatch(
      /\.flatpickr-calendar\.hasWeeks,\s*\.flatpickr-calendar\.multiMonth \{\s*box-sizing: content-box;/,
    );
    expect(source).not.toMatch(/!important/);
  });

  it("holds each month grid at its own width", () => {
    // Without a fixed width the first of two `.dayContainer`s grew to the
    // full calendar, wrapped 14 days per row, and clipped the second month.
    expect(source).toMatch(/\.flatpickr-days \{\s*display: flex;/);
    expect(source).toMatch(/\.dayContainer \{[^}]*width: to-rem\(280px\);/);
    expect(source).toMatch(/\.flatpickr-day\.hidden \{\s*visibility: hidden;/);
  });
});
