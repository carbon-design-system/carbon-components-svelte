// @vitest-environment node
// @depends-on css/**
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scssFiles } from "./scss-files";

const CSS_DIR = join(__dirname, "../../css");

// Features newer than the browser floor (Chrome 87, Safari 14.1) that
// lightningcss downlevels by duplicating the rule: logical corner radii
// expand to `:lang()` RTL hacks (~900 bytes per declaration), selector
// lists in `:not()` / `:is()` / `:where()` emit a `:-webkit-any` twin. A
// `:where()` without a list passes through unchanged. Logical insets pass
// through since Safari 14.1.
const COSTLY_DOWNLEVELS = [
  /border-(start|end)-(start|end)-radius\s*:/,
  /:not\([^()]*,/,
  /:is\(/,
  /:where\([^()]*,/,
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
