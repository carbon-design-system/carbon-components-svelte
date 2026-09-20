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

// Literal timings or `all` in a transition. Matches the whole declaration up
// to `;`, since the formatter wraps a multi-property list onto the lines
// after `transition:`. Returns 1-based line numbers and the number inspected.
function literalTransitions(lines: string[]) {
  const LITERAL = /\d(ms|s)\b|cubic-bezier|\ball\b/;
  const source = lines.map((line) => line.replace(/\/\/.*$/, "")).join("\n");
  const matches = [...source.matchAll(/\btransition:\s*([^;]+);/g)];
  return {
    inspected: matches.length,
    found: matches
      .filter((match) => LITERAL.test(match[1]))
      .map((match) => source.slice(0, match.index).split("\n").length),
  };
}

// `:hover` outside an `(any-hover: hover)` block, as 1-based line numbers.
// Two shapes are exempt because they restate a resting style instead of
// adding a hover effect, and guarding them would let an unguarded base hover
// rule through on touch: `:focus:hover` riding in a `:focus` list, and
// `X:hover` listed beside its own `X` (a readonly/disabled suppressor).
function unguardedHover(lines: string[]): number[] {
  const found: number[] = [];
  let depth = 0;
  let guardDepth = -1;
  // Lines of the selector list being read, until its `{`.
  let pending: { text: string; line: number }[] = [];
  lines.forEach((line, index) => {
    const code = line.split("//")[0].replace(/#\{[^}]*\}/g, "PFX");
    if (code.includes("any-hover: hover") && guardDepth < 0) guardDepth = depth;
    if (code.trim() && !/[;}]\s*$/.test(code))
      pending.push({ text: code, line: index + 1 });
    if (code.includes("{")) {
      const parts = pending
        .flatMap(({ text, line }) =>
          text
            .replace(/\{.*$/, "")
            .split(",")
            .map((part) => ({ part: part.trim().replace(/\s+/g, " "), line })),
        )
        .filter(({ part }) => part);
      const listed = new Set(parts.map(({ part }) => part));
      for (const { part, line } of parts) {
        const hover = part.replace(/:not\(:hover\)|:focus:hover/g, "");
        if (
          guardDepth < 0 &&
          hover.includes(":hover") &&
          !listed.has(part.replace(/:hover/g, ""))
        )
          found.push(line);
      }
    }
    if (/[{};]/.test(code)) pending = [];
    depth += (code.match(/\{/g) ?? []).length;
    depth -= (code.match(/\}/g) ?? []).length;
    if (guardDepth >= 0 && depth <= guardDepth) guardDepth = -1;
  });
  return [...new Set(found)];
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
    let declarations = 0;
    const found = PARTIALS.flatMap((name) => {
      const result = literalTransitions(
        readFileSync(join(CSS_DIR, name), "utf8").split("\n"),
      );
      declarations += result.inspected;
      return result.found.map((line) => `${name}:${line}`);
    });
    expect(declarations).toBeGreaterThan(0);
    expect(found).toEqual([]);
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
      ["profile-menu", "header-switcher"],
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

  it("pins the fluid CopyInput button with a real `right` offset, not `auto`", () => {
    // Regression guard: a logical-inset cleanup swapped `inset-inline-end`
    // for `right: $carbon--spacing-03` but left an existing `right: auto`
    // in the same fluid rule. A later dead-declaration pass correctly
    // pruned the now-unreachable `right: $carbon--spacing-03`, leaving
    // only `right: auto` — no offset at all — and the button fell back to
    // its static (left) position. See PR #3863.
    const css = readFileSync(join(CSS_DIR, "_copy-input.scss"), "utf8");
    // `block-size: to-rem(32px)` only appears once, inside the fluid
    // `.bx--form--fluid .bx--copy-btn` override (the non-fluid rule above
    // it uses `width`/`height` only), so anchoring here can't accidentally
    // match the base rule's unrelated `right: 0`.
    const fluidRule = css.match(
      /block-size: to-rem\(32px\);[\s\S]*?\n\s*\}/,
    )?.[0];
    expect(fluidRule).toBeDefined();
    expect(fluidRule).not.toMatch(/right:\s*auto\s*;/);
    expect(fluidRule).toMatch(/right:\s*\$carbon--spacing-\d\d;/);
  });

  it("guards hover rules with (any-hover: hover)", () => {
    const unguarded = PARTIALS.flatMap((name) =>
      unguardedHover(readFileSync(join(CSS_DIR, name), "utf8").split("\n")).map(
        (line) => `${name}:${line}`,
      ),
    );
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
    // The lookahead matters: without it, `.foo.foo--bar` (a base class next
    // to its own BEM modifier, a normal 2-class compound) false-positives,
    // since `.foo` is a literal prefix of `.foo--bar`.
    expect(offenders(/(\.#\{\$prefix\}--[\w-]+)\1(?![\w-])/)).toEqual([]);
  });
});

// The vendored tree keeps upstream's style, except below a
// `// carbon-components-svelte patch` banner: those blocks are hand-authored
// and appended at the end of a component file, so they follow the same rules.
const VENDOR_DIR = join(CSS_DIR, "vendor/carbon-components/scss");
const PATCH_BANNER = "// carbon-components-svelte patch";

function scssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) return scssFiles(file);
    return entry.name.endsWith(".scss") ? [file] : [];
  });
}

/** Each patched file, blanked above its first banner so line numbers hold. */
const PATCHES = scssFiles(VENDOR_DIR).flatMap((file) => {
  const lines = readFileSync(file, "utf8").split("\n");
  const start = lines.findIndex((line) => line.startsWith(PATCH_BANNER));
  return start < 0
    ? []
    : [
        {
          name: file.slice(VENDOR_DIR.length + 1),
          lines: lines.map((line, index) => (index < start ? "" : line)),
        },
      ];
});

const matching =
  (pattern: RegExp) =>
  (lines: string[]): number[] =>
    lines.flatMap((line, index) =>
      !line.trimStart().startsWith("//") && pattern.test(line.split("//")[0])
        ? [index + 1]
        : [],
    );

const PATCH_RULES: Record<string, (lines: string[]) => number[]> = {
  "literal .bx-- class": matching(/\.bx--/),
  "hex color": matching(/#[0-9a-fA-F]{3,8}\b(?!\{)/),
  "bare rem()": matching(/(^|[^a-z-])rem\(/),
  "raw rem literal": matching(/^(?!\s*--).*(?<![\w.(-])\d*\.?\d+rem\b/),
  "literal breakpoint": matching(/@media[^{]*(min|max)-width/),
  "$spacing-* alias": matching(/\$spacing-\d/),
  "var() with literal fallback": matching(
    /var\(--cds-[\w-]+,\s*(rgba?\(|#[0-9a-f])/i,
  ),
  ":has()": matching(/:has\(/),
  "repeated class": matching(/(\.#\{\$prefix\}--[\w-]+)\1(?![\w-])/),
  "literal transition": (lines) => literalTransitions(lines).found,
  "unguarded :hover": unguardedHover,
};

// Violations that predate this check, as a count per `rule: file`. The
// comparison is exact, so fixing one means lowering its count here, and the
// map only ever shrinks. Do not raise a count or add an entry: fix the new
// rule instead. "repeated class" in tabs is deliberate (each site carries a
// comment naming the `:not()` chain whose specificity it preserves).
// The remaining literal transitions use timings with no motion token (300ms,
// 175ms). The shell overlay's `var(--cds-overlay, …)` fallback is fixed:
// swapped for `$overlay-01`, the token this build actually declares.
const KNOWN_PATCH_VIOLATIONS: Record<string, number> = {
  "repeated class: components/tabs/_tabs.scss": 4,
  "literal transition: components/data-table/_data-table-action.scss": 1,
  "literal transition: components/ui-shell/_ui-shell.scss": 1,
  // What is left competes with a base hover rule the vendored tree leaves
  // unguarded (readonly/disabled resets, the shell header, link,
  // copy-button), or shares its declarations with `:active`/`:focus`/a
  // selected class. Guarding only the patch half would let the base hover
  // through on touch, so these move when the base rule does. Tabs is done:
  // both its base mixin and every patch mixin below it guard `:hover`
  // together (components/tabs/_tabs.scss).
  "unguarded :hover: components/content-switcher/_content-switcher.scss": 1,
  "unguarded :hover: components/copy-button/_copy-button.scss": 1,
  "unguarded :hover: components/data-table/_data-table-action.scss": 1,
  "unguarded :hover: components/data-table/_data-table.scss": 5,
  "unguarded :hover: components/date-picker/_date-picker.scss": 4,
  "unguarded :hover: components/link/_link.scss": 1,
  "unguarded :hover: components/multi-select/_multi-select.scss": 1,
  "unguarded :hover: components/select/_select.scss": 3,
  "unguarded :hover: components/slider/_slider.scss": 2,
  "unguarded :hover: components/structured-list/_structured-list.scss": 2,
  "unguarded :hover: components/time-picker/_time-picker.scss": 1,
  "unguarded :hover: components/ui-shell/_ui-shell.scss": 4,
};

describe("vendored patch block conventions", () => {
  it("finds the patch blocks", () => {
    expect(PATCHES.length).toBeGreaterThan(30);
  });

  it("adds no violations beyond the known baseline", () => {
    const counts: Record<string, number> = {};
    const changed: string[] = [];
    for (const [rule, find] of Object.entries(PATCH_RULES)) {
      for (const { name, lines } of PATCHES) {
        const found = find(lines);
        const key = `${rule}: ${name}`;
        if (found.length > 0) counts[key] = found.length;
        if (found.length !== (KNOWN_PATCH_VIOLATIONS[key] ?? 0))
          changed.push(`${key}:${found.join(",")}`);
      }
    }
    // Lists the line numbers of any file whose count moved.
    expect(changed).toEqual([]);
    expect(counts).toEqual(KNOWN_PATCH_VIOLATIONS);
  });
});

// In-place edits to upstream rules carry a trailing `// ccs: <reason>`. Keep
// only those lines (above any patch banner, which PATCHES already covers).
const CCS_EDITS = scssFiles(VENDOR_DIR).flatMap((file) => {
  const lines = readFileSync(file, "utf8").split("\n");
  const banner = lines.findIndex((line) => line.startsWith(PATCH_BANNER));
  const kept = lines.map((line, index) =>
    (banner < 0 || index < banner) && /\/\/ ccs:/.test(line) ? line : "",
  );
  return kept.some(Boolean)
    ? [{ name: file.slice(VENDOR_DIR.length + 1), lines: kept }]
    : [];
});

// Single-line rules only: an edited line has no rule structure around it.
// Value style (`$spacing-*`, raw rem) is left to match the upstream lines
// around the edit; these are the rules that hold either way.
const CCS_EDIT_RULES = [
  "literal .bx-- class",
  "hex color",
  ":has()",
  "repeated class",
];

describe("in-place `// ccs:` edits", () => {
  it("finds the edited lines", () => {
    expect(CCS_EDITS.length).toBeGreaterThan(20);
  });

  it("follow the selector and color conventions", () => {
    const found = CCS_EDIT_RULES.flatMap((rule) =>
      CCS_EDITS.flatMap(({ name, lines }) =>
        PATCH_RULES[rule](lines).map((line) => `${rule}: ${name}:${line}`),
      ),
    );
    expect(found).toEqual([]);
  });
});

// Rules that hold for everything hand-authored: partials and patch blocks.
const HAND_AUTHORED = [
  ...PARTIALS.map((name) => ({
    name,
    lines: readFileSync(join(CSS_DIR, name), "utf8").split("\n"),
  })),
  ...PATCHES,
];

// Custom properties under Carbon's `--cds-*` namespace that predate the
// `--ccs-*` rule and are public API now.
const LEGACY_CDS_PROPERTIES = new Set([
  "--cds-popover-offset",
  "--cds-popover-caret-offset",
  "--cds-scroll-gradient-color",
]);

const SHARED_RULES: Record<string, (lines: string[]) => number[]> = {
  // `z("…")` covers anything that floats over the page; one digit is local
  // stacking inside the component's own box.
  "literal z-index": matching(/z-index:\s*-?\d{2,}/),
  "element-qualified class": matching(
    /(^|[\s>+~,])[a-z][a-z0-9]*\.#\{\$prefix\}/,
  ),
  "new --cds-* property": (lines) =>
    lines.flatMap((line, index) =>
      [...line.split("//")[0].matchAll(/(?:^|[{;\s])(--cds-[\w-]+)\s*:/g)].some(
        ([, property]) => !LEGACY_CDS_PROPERTIES.has(property),
      )
        ? [index + 1]
        : [],
    ),
  // Allowed only under a comment that names what it has to beat.
  "unexplained !important": (lines) =>
    lines.flatMap((line, index) =>
      line.split("//")[0].includes("!important") &&
      !lines
        .slice(Math.max(0, index - 8), index)
        .some((above) => /^\s*\/\/.*!important/.test(above))
        ? [index + 1]
        : [],
    ),
};

// Same contract as KNOWN_PATCH_VIOLATIONS: exact counts that only shrink.
// The z-index values have no `z()` layer (9000 sits on "modal" by
// coincidence, 10000 is above the map). The element qualifiers out-rank
// `legend`/`tr` rules in the vendored base.
const KNOWN_SHARED_VIOLATIONS: Record<string, number> = {
  "literal z-index: _profile-menu.scss": 1,
  "literal z-index: components/ui-shell/_ui-shell.scss": 2,
  "element-qualified class: _fluid-pin-code-input.scss": 3,
  "element-qualified class: components/data-table/_data-table.scss": 4,
};

describe("hand-authored conventions (partials and patch blocks)", () => {
  it("adds no violations beyond the known baseline", () => {
    const counts: Record<string, number> = {};
    const changed: string[] = [];
    for (const [rule, find] of Object.entries(SHARED_RULES)) {
      for (const { name, lines } of HAND_AUTHORED) {
        const found = find(lines);
        const key = `${rule}: ${name}`;
        if (found.length > 0) counts[key] = found.length;
        if (found.length !== (KNOWN_SHARED_VIOLATIONS[key] ?? 0))
          changed.push(`${key}:${found.join(",")}`);
      }
    }
    expect(HAND_AUTHORED.length).toBeGreaterThan(PARTIALS.length);
    expect(changed).toEqual([]);
    expect(counts).toEqual(KNOWN_SHARED_VIOLATIONS);
  });

  it("still sees the !important declarations it vets", () => {
    const total = HAND_AUTHORED.flatMap(({ lines }) =>
      lines.filter((line) => line.split("//")[0].includes("!important")),
    );
    expect(total.length).toBeGreaterThan(0);
  });
});
