// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("read-only field icons", () => {
  // A read-only field is still in use: its value is read and focused, so
  // the icon that says what kind of field it is (a chevron, a calendar)
  // keeps 3:1 contrast. The disabled icon color is about 1.6:1 in every
  // theme.
  it.each([
    ".bx--select--readonly .bx--select__arrow",
    ".bx--time-picker__select.bx--select--readonly .bx--select__arrow",
    ".bx--dropdown--readonly .bx--list-box__menu-icon svg",
    ".bx--combo-box--readonly .bx--list-box__menu-icon svg",
    ".bx--multi-select--readonly .bx--list-box__menu-icon svg",
    ".bx--date-picker-input__wrapper--readonly .bx--date-picker__icon",
  ])(
    "%s uses the secondary icon color",
    async (selector) => {
      const rules = parseRules(await compileEntry("all.scss"));
      const fills = rules
        .filter(
          (r) =>
            r.selector.split(/,\s*/).includes(selector) && r.decls.has("fill"),
        )
        .map((r) => r.decls.get("fill"));
      expect(fills).toEqual(["var(--cds-icon-secondary)"]);
    },
    30_000,
  );
});
