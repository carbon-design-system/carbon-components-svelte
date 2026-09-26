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
  // min measured 653,163 after ScrollGradient's fill token classes; gzip
  // measured 74,854 in CI, ~1.5 kB above a local run
  "all.scss": { min: 666_300, gzip: 76_400 },
  // min measured 561,502 after ScrollGradient's fill token classes; gzip
  // measured 65,233
  "white.scss": { min: 572_800, gzip: 66_600 },
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
