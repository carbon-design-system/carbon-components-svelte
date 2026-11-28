/**
 * The library's theme sheets, which the site links ahead of its own CSS
 * instead of bundling.
 *
 * - They're minified already, and Bun's CSS minifier would merge their
 *   selectors into `:is()` and then lower each one to a `:-webkit-any()`
 *   copy, adding 240 kB.
 * - Bun's dev server links every sheet a page can load in reverse import
 *   order, so imported, they came after the site's own CSS: a page rule
 *   that ties Carbon's specificity lost in dev only.
 *
 * The build writes them as one hashed file (`build.ts`). The dev server
 * serves them at `DEV_URL`, and `src/index.ts` links them.
 */
import fs from "node:fs";
import path from "node:path";
import type { BunPlugin } from "bun";
import { PLEX_URL, rewritePlexUrls } from "./self-host-plex.ts";

const CARBON_CSS = path.resolve(import.meta.dirname, "../../css");

/** In cascade order. */
const CARBON_SHEETS = [
  "all.css",
  "prose.css",
  "syntax-tokens.css",
  "syntax.css",
].map((file) => path.join(CARBON_CSS, file));

/** Where the dev server serves them; `src/index.ts` links the same URL. */
export const DEV_URL = "/assets/carbon.css";

/** The sheets, their Plex URLs pointed at the site's copies. */
export function readCarbonSheets(): string[] {
  return CARBON_SHEETS.map((file) =>
    rewritePlexUrls(
      fs.readFileSync(file, "utf8"),
      (family) => `${PLEX_URL}/${family}/fonts/`,
    ),
  );
}

/** Fails on an import of one of the library's sheets. */
export const noCarbonSheetImports: BunPlugin = {
  name: "no-carbon-sheet-imports",
  setup(build) {
    build.onLoad({ filter: /[\\/]css[\\/][^\\/]+\.css$/ }, (args) => {
      if (path.dirname(args.path) !== CARBON_CSS) return undefined;
      throw new Error(
        `${path.basename(args.path)}: link it through CARBON_SHEETS in scripts/carbon-sheets.ts instead of importing it`,
      );
    });
  },
};
