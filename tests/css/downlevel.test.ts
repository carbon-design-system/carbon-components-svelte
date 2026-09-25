// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scssFiles } from "./scss-files";

const CSS_DIR = join(__dirname, "../../css");

// Features newer than the Svelte 5 baseline (Chrome 87, Safari 14.0) that
// lightningcss downlevels by duplicating the rule: flow-relative insets and
// corner radii expand to `:lang()` RTL hacks (~900 bytes per declaration),
// selector lists in `:not()` / `:is()` emit a `:-webkit-any` twin.
const COSTLY_DOWNLEVELS = [
  /inset-inline-(start|end)\s*:/,
  /border-(start|end)-(start|end)-radius\s*:/,
  /:not\([^()]*,/,
  /:(is|where)\(/,
];

describe("css downlevel cost", () => {
  it("sources avoid features that lightningcss duplicates rules for", () => {
    const offenders = scssFiles(CSS_DIR).flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .map((line, i) => ({ line: line.replace(/\/\/.*$/, ""), i }))
        .filter(({ line }) => COSTLY_DOWNLEVELS.some((re) => re.test(line)))
        .map(({ i }) => `${file.slice(CSS_DIR.length + 1)}:${i + 1}`),
    );
    expect(offenders).toEqual([]);
  }, 30_000);
});
