// @vitest-environment node
import { measureCss, type Size } from "../../scripts/lib/css-size";
import { compileEntry } from "./compile";

// Shipped size of each entry, measured the way `bun run check:css:size`
// does, on the expanded sheet the other css tests share.
//
// `all.css` and `white.css` have no ceiling here. A fixed ceiling fills up
// with legitimate features and then fails the next one. `check:css:size`
// limits how much one PR may grow them instead, against its merge base,
// which catches a bulk regression (a re-synced vendored file, unpruned
// selectors) in the PR that makes it. See CONTRIBUTING, Guards.
//
// Each floor sits about 20% under the size measured below, so a compile
// that silently drops a module or emits nothing fails.
const SHEETS: Record<string, { floor: number; ceiling?: Size }> = {
  // min 791,899 measured 2026-10-24
  "all.scss": { floor: 630_000 },
  // min 684,352 measured 2026-10-24
  "white.scss": { floor: 545_000 },
  // Prose's opt-in sheet keeps a ceiling about 10% above its size. The
  // per-PR limit is sized for all.css and would let it grow by half.
  // min 62,493 and gzip 4,469 measured 2026-10-23
  "prose.scss": { floor: 55_000, ceiling: { min: 68_800, gzip: 4_950 } },
  // The data visualization entry, loaded only by apps that import it, keeps
  // a ceiling about 10% above its size for the same reason as prose.
  // min 130,043 and gzip 15,334 measured 2026-10-22
  // min 144,216 and gzip 16,9xx measured 2026-10-24, after labels, annotations,
  // brush, crosshair, patterns, states, and StatusGrid.
  "viz.scss": { floor: 115_000, ceiling: { min: 152_000, gzip: 18_000 } },
};

describe("css size", () => {
  for (const [entry, { floor, ceiling }] of Object.entries(SHEETS)) {
    it(`${entry} compiles to a plausible size`, async () => {
      const css = await compileEntry(entry);
      const size = measureCss(css, entry.replace(".scss", ".css"));
      expect(size.min).toBeGreaterThan(floor);
      if (ceiling) {
        expect(size.min).toBeLessThanOrEqual(ceiling.min);
        expect(size.gzip).toBeLessThanOrEqual(ceiling.gzip);
      }
    }, 60_000);
  }
});
