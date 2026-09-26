// @vitest-environment node
import { gzipSync } from "node:zlib";
import { transform } from "lightningcss";
import { targets } from "../../scripts/lib/css-targets";
import { compileEntry } from "./compile";

// Shipped size of each entry: sass compressed, then the same Lightning CSS
// pass `BUILD_CSS_MINIFY=1` and release run. Ceilings sit about 2% above the
// measured size so ordinary additions fit but a regression of the pruning
// work (902 kB -> 673 kB for all.css) does not. When a deliberate addition
// trips one, raise it to the new size plus 2% and say why in the commit.
// `bun run check:css` prints the current numbers.
const BUDGETS: Record<string, { min: number; gzip: number }> = {
  // measured 640,044 / 73,328 (lowered after dropping unused Plex weights)
  "all.scss": { min: 652_800, gzip: 74_800 },
  // measured 549,482 / 63,859
  "white.scss": { min: 560_500, gzip: 65_100 },
};

describe("css size budget", () => {
  for (const [entry, budget] of Object.entries(BUDGETS)) {
    it(`${entry} stays within its minified and gzipped budget`, async () => {
      const css = await compileEntry(entry, "compressed");
      const { code } = transform({
        filename: entry.replace(".scss", ".css"),
        code: Buffer.from(css, "utf8"),
        targets,
        minify: true,
      });
      const size = { min: code.byteLength, gzip: gzipSync(code).byteLength };
      // A floor too, so a compile that silently emits nothing fails.
      expect(size.min).toBeGreaterThan(budget.min * 0.8);
      expect(size.min).toBeLessThanOrEqual(budget.min);
      expect(size.gzip).toBeLessThanOrEqual(budget.gzip);
    }, 60_000);
  }
});
