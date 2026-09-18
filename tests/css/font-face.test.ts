import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FONT_FACE_DIR = join(
  __dirname,
  "../../css/vendor/carbon-components/scss/globals/scss/vendor/@carbon/elements/scss/type/font-face",
);

describe("@font-face sources", () => {
  it("only lists woff2, which every supported browser loads first", () => {
    for (const file of readdirSync(FONT_FACE_DIR)) {
      const scss = readFileSync(join(FONT_FACE_DIR, file), "utf8");
      expect(scss, file).not.toMatch(/format\('woff'\)/);
      expect(scss, file).not.toMatch(/\.woff'/);
    }
  });
});
