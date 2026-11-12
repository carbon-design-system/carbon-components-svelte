// @vitest-environment node
import {
  normalizeButtonSize,
  normalizeDataTableSize,
  normalizeFieldSize,
  normalizeProgressBarSize,
} from "../../src/utils/size-aliases.js";

describe("size alias helpers", () => {
  it("resolve an alias to the component's own name", () => {
    expect(normalizeButtonSize("sm")).toBe("small");
    expect(normalizeButtonSize("md")).toBe("field");
    expect(normalizeButtonSize("2xl")).toBe("xl");
    expect(normalizeFieldSize("lg")).toBe("xl");
    expect(normalizeProgressBarSize("small")).toBe("sm");
    expect(normalizeProgressBarSize("big")).toBe("md");
  });

  it("resolve an alias of the default size to undefined", () => {
    expect(normalizeDataTableSize("lg")).toBeUndefined();
  });

  it("return a name that is not an alias unchanged", () => {
    expect(normalizeButtonSize("lg")).toBe("lg");
    expect(normalizeButtonSize("xl")).toBe("xl");
    expect(normalizeFieldSize("md")).toBe("md");
    expect(normalizeFieldSize(undefined)).toBeUndefined();
  });

  it("ignore keys inherited from Object.prototype", () => {
    expect(normalizeFieldSize("toString")).toBe("toString");
    expect(normalizeFieldSize("constructor")).toBe("constructor");
  });
});
