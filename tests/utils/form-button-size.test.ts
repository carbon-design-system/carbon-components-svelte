import { formButtonSize } from "../../src/utils/form-button-size.js";

describe("formButtonSize", () => {
  it("maps each Form size to the button of the same height", () => {
    expect(formButtonSize("xs")).toBe("xs");
    expect(formButtonSize("sm")).toBe("small");
    expect(formButtonSize("xl")).toBe("default");
  });

  it("returns undefined for an unset or unknown size", () => {
    expect(formButtonSize(undefined)).toBeUndefined();
    expect(formButtonSize("md")).toBeUndefined();
  });
});
