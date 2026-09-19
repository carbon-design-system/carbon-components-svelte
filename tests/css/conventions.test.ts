import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CSS_DIR = join(__dirname, "../../css");

// Hand-authored partials only. The vendored Carbon tree keeps upstream's
// style and is covered by the compiled-output tests instead.
const PARTIALS = readdirSync(CSS_DIR).filter(
  (name) => name.startsWith("_") && name.endsWith(".scss"),
);

// Partials that legitimately emit nothing through `exports()`: the manifest,
// a Sass map and declaration mixins other partials import, and the `$ccs-theme-switching`-gated
// theme scopes.
const NO_EXPORTS = new Set([
  "_carbon-styles.scss",
  "_fluid-shared.scss",
  "_spacing-scale.scss",
  "_status-colors.scss",
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

  it("documents every mixin with SassDoc access and group tags", () => {
    const undocumented = PARTIALS.flatMap((name) => {
      const lines = readFileSync(join(CSS_DIR, name), "utf8").split("\n");
      return lines.flatMap((line, index) =>
        line.startsWith("@mixin") &&
        !(
          lines[index - 1]?.startsWith("/// @group ") &&
          lines[index - 2] === "/// @access private" &&
          lines[index - 3]?.startsWith("///")
        )
          ? [`${name}:${index + 1}`]
          : [],
      );
    });
    expect(undocumented).toEqual([]);
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

  it("keeps the manifest's load-bearing import order", () => {
    const manifest = readFileSync(join(CSS_DIR, "_carbon-styles.scss"), "utf8");
    const position = (name: string) => {
      const index = manifest.indexOf(`@import "./${name}";`);
      expect(index, name).toBeGreaterThan(-1);
      return index;
    };
    // [earlier, later]: the later partial wins equal-specificity ties.
    const pairs = [
      ["copy-input", "fluid-text-input"],
      ["fluid-list-box", "fluid-combo-box"],
      ["fluid-list-box", "fluid-multiselect"],
      ["fluid-text-input", "fluid-pin-code-input"],
      ["fluid-text-input", "fluid-time-picker"],
      ["fluid-multiselect", "list-box-wrap-options"],
      ["fluid-multiselect", "dropdown"],
    ];
    for (const [earlier, later] of pairs) {
      expect(position(earlier), `${earlier} < ${later}`).toBeLessThan(
        position(later),
      );
    }
  });

  it("derives indicator status colors from one shared palette", () => {
    for (const name of ["_icon-indicator.scss", "_shape-indicator.scss"]) {
      const source = readFileSync(join(CSS_DIR, name), "utf8");
      expect(source).toContain("ccs-status-colors()");
      expect(source).not.toMatch(/\$status-\w+: if\(/);
    }
  });

  it("keeps _fluid-shared.scss to declaration mixins that emit nothing", () => {
    const source = readFileSync(join(CSS_DIR, "_fluid-shared.scss"), "utf8");
    expect(source).not.toMatch(/^\s*[.[&][^;]*\{/m);
    expect(source.match(/^@mixin fluid-/gm)?.length).toBeGreaterThan(3);
  });

  it("scopes every fluid rule under a fluid class", () => {
    // The bare `__divider` hides are shared with CopyInput's markup.
    const allowed = new Set([
      "_fluid-text-area.scss:.#{$prefix}--text-area__divider,",
      "_fluid-text-input.scss:.#{$prefix}--text-input__divider,",
    ]);
    const unscoped = PARTIALS.filter((name) =>
      name.startsWith("_fluid-"),
    ).flatMap((name) => {
      const found: string[] = [];
      let selector = "";
      for (const line of readFileSync(join(CSS_DIR, name), "utf8").split(
        "\n",
      )) {
        // Top-level selectors sit at the mixin's two-space indent and may
        // wrap onto deeper continuation lines until `{` or `,`.
        if (/^ {2}[.[*a-z]/.test(line)) selector = line.trim();
        else if (selector && /^ {4}\S/.test(line))
          selector += ` ${line.trim()}`;
        else continue;
        if (/[{,]$/.test(selector)) {
          if (
            !selector.includes("fluid") &&
            !allowed.has(`${name}:${selector}`)
          )
            found.push(`${name}: ${selector}`);
          selector = "";
        }
      }
      return found;
    });
    expect(unscoped).toEqual([]);
  });

  it("routes bare inset-block-start/right/pointer-events icon rules through fluid-status-icon()", () => {
    // A rule whose own declarations are exactly the mixin's three
    // properties should call fluid-status-icon() instead of repeating them.
    // Rules that legitimately stay bare need a different property set: an
    // extra position/display (fluid-time-picker's icon has no base v10
    // position to inherit), or fewer of the three because a base v10 rule
    // already supplies right/pointer-events (fluid-text-input,
    // fluid-date-picker), or a different reference frame entirely
    // (fluid-pin-code-input, fluid-text-area anchor to the message row, not
    // the field).
    const MIXIN_PROPS = ["inset-block-start", "right", "pointer-events"];
    const offenders: string[] = [];
    for (const name of PARTIALS.filter(
      (n) => n.startsWith("_fluid-") && n !== "_fluid-shared.scss",
    )) {
      // Strip `#{...}` interpolation so it can't be mistaken for a brace.
      const css = readFileSync(join(CSS_DIR, name), "utf8")
        .split("\n")
        .map((l) => l.split("//")[0])
        .join("\n")
        .replace(/#\{[^}]*\}/g, "PFX");
      let buf = "";
      let line = 1;
      let ruleLine = 1;
      for (const ch of css) {
        if (ch === "\n") line++;
        if (ch === "{") {
          buf = "";
          ruleLine = line;
        } else if (ch === "}") {
          const decls = buf
            .split(";")
            .map((d) => d.trim())
            .filter(Boolean);
          const usesMixin = decls.some((d) =>
            d.startsWith("@include fluid-status-icon("),
          );
          const props = decls
            .filter((d) => !d.startsWith("@include"))
            .map((d) => d.split(":")[0].trim());
          if (
            !usesMixin &&
            props.length === MIXIN_PROPS.length &&
            MIXIN_PROPS.every((p) => props.includes(p))
          )
            offenders.push(`${name}:${ruleLine}`);
          buf = "";
        } else buf += ch;
      }
    }
    expect(offenders).toEqual([]);
  });

  it("guards hover rules with (any-hover: hover)", () => {
    // `:focus:hover` rides along in `:focus` lists with the same declarations.
    const unguarded = PARTIALS.flatMap((name) => {
      const found: string[] = [];
      let depth = 0;
      let guardDepth = -1;
      readFileSync(join(CSS_DIR, name), "utf8")
        .split("\n")
        .forEach((line, index) => {
          const code = line.split("//")[0].replace(/#\{[^}]*\}/g, "");
          if (code.includes("any-hover: hover") && guardDepth < 0)
            guardDepth = depth;
          if (
            guardDepth < 0 &&
            code.replace(/:not\(:hover\)|:focus:hover/g, "").includes(":hover")
          )
            found.push(`${name}:${index + 1}`);
          depth += (code.match(/\{/g) ?? []).length;
          depth -= (code.match(/\}/g) ?? []).length;
          if (guardDepth >= 0 && depth <= guardDepth) guardDepth = -1;
        });
      return found;
    });
    expect(unguarded).toEqual([]);
  });

  it("reads theme tokens through Sass, not var() with a literal fallback", () => {
    // Static theme sheets declare no custom properties, so a hand-written
    // `var(--cds-shadow, rgba(...))` renders the light fallback in g100.
    expect(offenders(/var\(--cds-[\w-]+,\s*(rgba?\(|#[0-9a-f])/i)).toEqual([]);
  });

  it("positions the badge indicator with physical properties only", () => {
    // `right: 0` beside `margin-inline-end` pinned the badge to the right
    // while its margin flipped under `dir="rtl"`.
    const source = readFileSync(join(CSS_DIR, "_badge-indicator.scss"), "utf8");
    expect(source).not.toMatch(
      /(inset|margin|padding)-(inline|block)|-(inline|block)-size/,
    );
  });

  it("avoids :has(), which is newer than the browser baseline", () => {
    expect(offenders(/:has\(/)).toEqual([]);
  });

  it("does not pad specificity by repeating a class in one compound", () => {
    // Sites not yet converted to fix the competing rule instead. Shrink this
    // list as each is converted; a converted site must stay off it.
    const NOT_YET_CONVERTED = new Set([
      "_fluid-date-picker.scss",
      "_fluid-number-input.scss",
      "_fluid-text-area.scss",
      "_header-switcher.scss",
      "_profile-menu.scss",
      "_ui-shell-classic.scss",
    ]);
    // The lookahead matters: without it, `.foo.foo--bar` (a base class next
    // to its own BEM modifier, a normal 2-class compound) false-positives,
    // since `.foo` is a literal prefix of `.foo--bar`.
    expect(
      offenders(/(\.#\{\$prefix\}--[\w-]+)\1(?![\w-])/, NOT_YET_CONVERTED),
    ).toEqual([]);
  });
});
