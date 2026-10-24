// @vitest-environment node
import { gzipSync } from "node:zlib";
import { transform } from "lightningcss";
import { targets } from "../../scripts/lib/css-targets";
import { compileEntry } from "./compile";

// Shipped size of each entry: the same Lightning CSS pass `BUILD_CSS_MINIFY=1`
// and release run, applied to the expanded sheet the other css tests share
// rather than to a second, compressed compile. It keeps a few spaces inside
// `calc()` that sass compressed drops, so it reads under 100 bytes over the
// shipped size.
//
// This guards the pruning work (902 kB -> 673 kB for all.css), not each
// feature: ceilings sit about 10% above the size measured below, so ordinary
// additions do not trip it. Do not raise a ceiling to fit a feature. A failure
// means a bulk regression (a re-synced vendored file, unpruned selectors,
// lost minification) or growth worth reviewing as a whole. The `css-cascade`
// job reports each PR's size movement. `bun run check:css` prints the current
// numbers.
const BUDGETS: Record<string, { min: number; gzip: number }> = {
  // min 729,440 and gzip 85,373 measured 2026-10-21
  "all.scss": { min: 802_000, gzip: 94_000 },
  // min 634,870 and gzip 75,894 measured 2026-10-21
  "white.scss": { min: 698_000, gzip: 83_500 },
  // Prose's opt-in sheet. min 62,493 and gzip 4,469 measured 2026-10-23
  "prose.scss": { min: 68_800, gzip: 4_950 },
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
