import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CSS_DIR = join(__dirname, "../../css");

function scssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) return scssFiles(file);
    return entry.name.endsWith(".scss") ? [file] : [];
  });
}

// Upstream aliases and hooks no component renders. Button emits `--field` and
// the single-dash `danger-ghost` / `danger-tertiary` kinds only.
const UNRENDERED = [
  /--btn--md\b/,
  /--btn--danger--(ghost|tertiary)/,
  /&--(ghost|tertiary) \{/,
  /\}--focused\b/,
  /overflow-menu-options__content/,
  // `:not()` guards on these only padded specificity.
  /side-nav__item--active/,
  /pagination-nav__page--direction/,
  /header__menu-toggle__hidden/,
  // Pruned as styled-but-unrendered; see tests/css/unrendered-classes.test.ts.
  /inline-loading__checkmark\b(?!-)/,
];

describe("unrendered selectors", () => {
  it("stay pruned from the SCSS sources", () => {
    const offenders = scssFiles(CSS_DIR).flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          !line.trimStart().startsWith("//") &&
          UNRENDERED.some((pattern) => pattern.test(line.split("//")[0]))
            ? [`${file.slice(CSS_DIR.length + 1)}:${index + 1}`]
            : [],
        ),
    );
    expect(offenders).toEqual([]);
  }, 30_000);
});
