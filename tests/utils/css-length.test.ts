// @vitest-environment node
import { toCssLength } from "../../src/utils/css-length.js";

describe("toCssLength", () => {
  it("appends px to numbers, including zero", () => {
    expect(toCssLength(16)).toBe("16px");
    expect(toCssLength(0)).toBe("0px");
    expect(toCssLength(-8)).toBe("-8px");
  });

  it("passes strings and nullish values through", () => {
    expect(toCssLength("50%")).toBe("50%");
    expect(toCssLength("")).toBe("");
    expect(toCssLength(undefined)).toBeUndefined();
    expect(toCssLength(null)).toBeNull();
  });
});
