// @vitest-environment node
import {
  BUTTON_SIZE_ALIASES,
  DATA_TABLE_SIZE_ALIASES,
  FIELD_SIZE_ALIASES,
  normalizeSize,
  PROGRESS_BAR_SIZE_ALIASES,
} from "../../src/utils/size-aliases.js";

describe("normalizeSize", () => {
  it("resolves an alias to the component's own name", () => {
    expect(normalizeSize("sm", BUTTON_SIZE_ALIASES)).toBe("small");
    expect(normalizeSize("md", BUTTON_SIZE_ALIASES)).toBe("field");
    expect(normalizeSize("2xl", BUTTON_SIZE_ALIASES)).toBe("xl");
    expect(normalizeSize("lg", FIELD_SIZE_ALIASES)).toBe("xl");
    expect(normalizeSize("small", PROGRESS_BAR_SIZE_ALIASES)).toBe("sm");
    expect(normalizeSize("big", PROGRESS_BAR_SIZE_ALIASES)).toBe("md");
  });

  it("resolves an alias of the default size to undefined", () => {
    expect(normalizeSize("lg", DATA_TABLE_SIZE_ALIASES)).toBeUndefined();
  });

  it("returns a name that is not an alias unchanged", () => {
    expect(normalizeSize("lg", BUTTON_SIZE_ALIASES)).toBe("lg");
    expect(normalizeSize("xl", BUTTON_SIZE_ALIASES)).toBe("xl");
    expect(normalizeSize("md", FIELD_SIZE_ALIASES)).toBe("md");
    expect(normalizeSize(undefined, FIELD_SIZE_ALIASES)).toBeUndefined();
  });

  it("ignores keys inherited from Object.prototype", () => {
    expect(normalizeSize("toString", FIELD_SIZE_ALIASES)).toBe("toString");
    expect(normalizeSize("constructor", FIELD_SIZE_ALIASES)).toBe(
      "constructor",
    );
  });
});
