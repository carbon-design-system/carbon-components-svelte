// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FONT_FACE_DIR = join(
  __dirname,
  "../../css/vendor/carbon-components/scss/globals/scss/vendor/@carbon/elements/scss/type/font-face",
);

describe("@font-face sources", () => {
  it("only lists woff2, which every supported browser loads first", () => {
    let woff2Sources = 0;
    for (const file of readdirSync(FONT_FACE_DIR)) {
      const scss = readFileSync(join(FONT_FACE_DIR, file), "utf8");
      // Either quote style, so reformatting the vendored file keeps the guard.
      expect(scss, file).not.toMatch(/format\(["']woff["']\)/);
      expect(scss, file).not.toMatch(/\.woff["']/);
      woff2Sources += scss.match(/format\(["']woff2["']\)/g)?.length ?? 0;
    }
    // Fails if the patterns above stop matching how sources are written.
    expect(woff2Sources).toBeGreaterThan(0);
  });
});
