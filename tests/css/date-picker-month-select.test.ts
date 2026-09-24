import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(
    __dirname,
    "../../css/vendor/carbon-components/scss/components/date-picker/_date-picker.scss",
  ),
  "utf8",
);

function mixin(name: string, exportName: string) {
  const start = source.indexOf(`@mixin ${name} {`);
  const end = source.indexOf(`@include exports('${exportName}')`, start);
  if (start === -1 || end === -1) throw new Error(`missing mixin ${name}`);
  return source.slice(start, end);
}

describe("date picker month and year grids", () => {
  it("styles months that flatpickr disables", () => {
    // flatpickr's monthSelect plugin marks out-of-range months with
    // `flatpickr-disabled`, not `disabled`.
    const months = mixin("date-picker-month-select", "datepicker-month-select");
    expect(months).toMatch(
      /&\.flatpickr-disabled \{\s*color: \$disabled-02;\s*cursor: not-allowed;/,
    );
    expect(months).not.toMatch(/&\.disabled \{/);
  });

  it("keeps the class the local year plugin adds", () => {
    const years = mixin("date-picker-year-select", "datepicker-year-select");
    expect(years).toMatch(/&\.disabled \{/);
  });
});
