// @vitest-environment node
import { parseAspectRatio } from "../../src/utils/aspect-ratio.js";

describe("parseAspectRatio", () => {
  it("parses a WxH string, decimals included", () => {
    expect(parseAspectRatio("16x9")).toEqual({ width: 16, height: 9 });
    expect(parseAspectRatio("2.35x1")).toEqual({ width: 2.35, height: 1 });
  });

  it.each([undefined, 2, "", "16:9", "x9", "0x1", "1x0", " 2x1"])(
    "returns null for %j",
    (value) => {
      expect(parseAspectRatio(value)).toBeNull();
    },
  );
});
