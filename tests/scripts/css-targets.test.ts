// @vitest-environment node
import { targets } from "../../scripts/lib/css-targets";

describe("css targets", () => {
  it("packs each floor as major << 16 | minor << 8", () => {
    expect(targets).toEqual({
      chrome: 105 << 16,
      edge: 105 << 16,
      firefox: 121 << 16,
      safari: (15 << 16) | (4 << 8),
      ios_saf: (15 << 16) | (4 << 8),
    });
  });
});
