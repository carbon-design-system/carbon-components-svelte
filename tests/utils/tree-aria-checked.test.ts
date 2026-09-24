// @vitest-environment node
import { toAriaChecked } from "../../src/utils/tree-aria-checked.js";

describe("toAriaChecked", () => {
  it("returns mixed when indeterminate, regardless of selection", () => {
    expect(toAriaChecked(true, true)).toBe("mixed");
    expect(toAriaChecked(false, true)).toBe("mixed");
  });

  it("returns true when selected and not indeterminate", () => {
    expect(toAriaChecked(true, false)).toBe("true");
  });

  it("returns false when neither selected nor indeterminate", () => {
    expect(toAriaChecked(false, false)).toBe("false");
  });
});
