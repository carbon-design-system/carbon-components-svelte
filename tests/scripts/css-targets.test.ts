// @vitest-environment node
import { targets } from "../../scripts/lib/css-targets";

describe("css targets", () => {
  it("packs each floor as major << 16 | minor << 8", () => {
    expect(targets).toEqual({
      chrome: 124 << 16,
      edge: 124 << 16,
      firefox: 125 << 16,
      safari: (17 << 16) | (4 << 8),
      ios_saf: (17 << 16) | (4 << 8),
    });
  });
});
