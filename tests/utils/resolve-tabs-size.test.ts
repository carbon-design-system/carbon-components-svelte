// @vitest-environment node
import { resolveTabsSize } from "../../src/utils/resolve-tabs-size.js";

describe("resolveTabsSize", () => {
  it("returns undefined when size is unset", () => {
    expect(resolveTabsSize(undefined, 2)).toBeUndefined();
  });

  it("returns undefined for an unrecognized size", () => {
    // @ts-expect-error intentionally invalid for the test
    expect(resolveTabsSize("xxl", 2)).toBeUndefined();
  });

  it("passes through a size within range", () => {
    expect(resolveTabsSize("md", 2)).toBe("md");
  });

  it("clamps to the max size index for the type", () => {
    expect(resolveTabsSize("xl", 2)).toBe("lg");
  });

  it("allows the full scale when maxSizeIndex is 3", () => {
    expect(resolveTabsSize("xl", 3)).toBe("xl");
  });
});
