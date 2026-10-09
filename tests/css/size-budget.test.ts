// @vitest-environment node
import { gzipSync } from "node:zlib";
import { transform } from "lightningcss";
import { targets } from "../../scripts/lib/css-targets";
import { compileEntry } from "./compile";

// Shipped size of each entry: the same Lightning CSS pass `BUILD_CSS_MINIFY=1`
// and release run, applied to the expanded sheet the other css tests share
// rather than to a second, compressed compile. It keeps a few spaces inside
// `calc()` that sass compressed drops, so it reads under 100 bytes over the
// shipped size. Ceilings sit about 2% above the measured size so ordinary
// additions fit but a regression of the pruning work (902 kB -> 673 kB for
// all.css) does not. When a deliberate addition trips one, raise it to the
// new size plus 2% and say why in the commit.
// `bun run check:css` prints the current numbers.
const BUDGETS: Record<string, { min: number; gzip: number }> = {
  // min 667,390 and gzip 77,643 measured locally after TableOfContents
  "all.scss": { min: 680_800, gzip: 79_200 },
  // min 574,769 and gzip 68,194 measured locally after the field skeleton
  // sizes and TableOfContents
  "white.scss": { min: 586_300, gzip: 69_600 },
};

describe("css size budget", () => {
  for (const [entry, budget] of Object.entries(BUDGETS)) {
    it(`${entry} stays within its minified and gzipped budget`, async () => {
      const css = await compileEntry(entry);
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
