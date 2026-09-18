import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CSS_DIR = join(__dirname, "../../css");

// Only these get a compositor layer from the hint. On anything else it is a
// no-op, and on an idle element it pins a layer for nothing.
const COMPOSITABLE = new Set(["transform", "opacity"]);

function scssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) return scssFiles(file);
    return entry.name.endsWith(".scss") ? [file] : [];
  });
}

describe("will-change", () => {
  it("only hints compositable properties", () => {
    const offenders = scssFiles(CSS_DIR).flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(/will-change:\s*([^;]+);/g)]
        .filter(([, value]) =>
          value.split(",").some((prop) => !COMPOSITABLE.has(prop.trim())),
        )
        .map(([decl]) => `${file.slice(CSS_DIR.length + 1)} ${decl}`),
    );
    expect(offenders).toEqual([]);
  });

  it("is not set on skeletons, whose running animation already promotes them", () => {
    const mixins = readFileSync(
      join(
        CSS_DIR,
        "vendor/carbon-components/scss/globals/scss/_helper-mixins.scss",
      ),
      "utf8",
    );
    expect(mixins).not.toMatch(/will-change/);
  });
});
