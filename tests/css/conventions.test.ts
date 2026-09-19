import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CSS_DIR = join(__dirname, "../../css");

// Hand-authored partials only. The vendored Carbon tree keeps upstream's
// style and is covered by the compiled-output tests instead.
const PARTIALS = readdirSync(CSS_DIR).filter(
  (name) => name.startsWith("_") && name.endsWith(".scss"),
);

// Partials that legitimately emit nothing through `exports()`: the manifest,
// a Sass map other partials import, and the `$ccs-theme-switching`-gated
// theme scopes.
const NO_EXPORTS = new Set([
  "_carbon-styles.scss",
  "_spacing-scale.scss",
  "_ui-shell-classic.scss",
]);

/** `file:line` of every non-comment line in a partial matching `pattern`. */
function offenders(pattern: RegExp, skip: Set<string> = new Set()): string[] {
  return PARTIALS.filter((name) => !skip.has(name)).flatMap((name) =>
    readFileSync(join(CSS_DIR, name), "utf8")
      .split("\n")
      .flatMap((line, index) =>
        !line.trimStart().startsWith("//") && pattern.test(line)
          ? [`${name}:${index + 1}`]
          : [],
      ),
  );
}

describe("css partial conventions", () => {
  it("emits through a double-quoted exports() guard", () => {
    const missing = PARTIALS.filter(
      (name) =>
        !NO_EXPORTS.has(name) &&
        !/@include exports\("[a-z-]+"\)/.test(
          readFileSync(join(CSS_DIR, name), "utf8"),
        ),
    );
    expect(missing).toEqual([]);
  });

  it("does not reuse an exports() key, including vendored Carbon's", () => {
    const keys = new Map<string, string[]>();
    const collect = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const file = join(dir, entry.name);
        if (entry.isDirectory()) collect(file);
        else if (entry.name.endsWith(".scss")) {
          const source = readFileSync(file, "utf8");
          for (const [, key] of source.matchAll(
            /@include exports\(["']([^"']+)["']\)/g,
          )) {
            keys.set(key, [
              ...(keys.get(key) ?? []),
              file.slice(CSS_DIR.length + 1),
            ]);
          }
        }
      }
    };
    collect(CSS_DIR);
    // A second `exports("x")` compiles cleanly and emits nothing. Upstream
    // repeats a few keys within its own tree; only flag collisions that
    // involve a hand-authored partial.
    const collisions = [...keys].filter(
      ([, files]) =>
        files.length > 1 && files.some((file) => !file.startsWith("vendor/")),
    );
    expect(collisions).toEqual([]);
  });

  it("references classes through $prefix", () => {
    expect(offenders(/\.bx--/)).toEqual([]);
  });

  it("uses theme tokens, not hex colors", () => {
    expect(offenders(/#[0-9a-fA-F]{3,8}\b(?!\{)/)).toEqual([]);
  });

  it("converts px with to-rem(), not Carbon's bare rem()", () => {
    expect(offenders(/(^|[^a-z-])rem\(/)).toEqual([]);
  });

  it("has no raw rem literals or literal breakpoints", () => {
    // Custom property values are not evaluated by Sass, so `--x: 1rem` stays.
    const raw = offenders(
      /^(?!\s*--).*(?<![\w.(-])\d*\.?\d+rem\b/,
      new Set(["_spacing-scale.scss"]),
    );
    expect(raw).toEqual([]);
    expect(offenders(/@media[^{]*(min|max)-width/)).toEqual([]);
  });

  it("uses $carbon--spacing-* tokens, not the $spacing-* aliases", () => {
    // The aliases compile to `var(--cds-spacing-*)` in all.css while the
    // vendored base is mostly static, so mixing them only adds bytes.
    expect(offenders(/\$spacing-\d/)).toEqual([]);
  });

  it("times transitions with motion tokens and an explicit property list", () => {
    expect(offenders(/transition:.*(\d(ms|s)\b|cubic-bezier|\ball\b)/)).toEqual(
      [],
    );
  });

  it("avoids :has(), which is newer than the browser baseline", () => {
    expect(offenders(/:has\(/)).toEqual([]);
  });
});
