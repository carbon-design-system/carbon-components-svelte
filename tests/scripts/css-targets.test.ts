// @vitest-environment node
import { targets } from "../../scripts/lib/css-targets";

describe("css targets", () => {
  it("packs each floor as browserslistToTargets did", () => {
    // `browserslistToTargets(browserslist(["Chrome >= 87", "Firefox >= 83",
    // "Safari >= 14.1", "Edge >= 87"]))` before browserslist was dropped.
    expect(targets).toEqual({
      chrome: 87 << 16,
      edge: 87 << 16,
      firefox: 83 << 16,
      safari: (14 << 16) | (1 << 8),
    });
  });
});
