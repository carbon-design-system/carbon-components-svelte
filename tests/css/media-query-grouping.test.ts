// @depends-on css/**
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { scssFiles } from "./scss-files";

const CSS_DIR = join(__dirname, "../../css");
const VENDOR_DIR = join(CSS_DIR, "vendor/carbon-components/scss");
const PATCH_BANNER = "// carbon-components-svelte patch";
const HOVER_BLOCK = /^\s*@media\s*\(any-hover:\s*hover\)\s*\{/;

type Unit = { name: string; lines: string[] };

// One unit per hand-authored partial. A vendored file is split at its
// patch banners: the upstream part above the first banner is one unit, and
// each patch is another, named after the first mixin it declares, since a
// patch plays the part a partial does.
function units(): Unit[] {
  const partials = readdirSync(CSS_DIR)
    .filter((name) => name.startsWith("_") && name.endsWith(".scss"))
    .map((name) => ({
      name,
      lines: readFileSync(join(CSS_DIR, name), "utf8").split("\n"),
    }));
  const vendored = scssFiles(VENDOR_DIR).flatMap((file) => {
    const name = file.slice(VENDOR_DIR.length + 1);
    const sections: Unit[] = [{ name, lines: [] }];
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (line.startsWith(PATCH_BANNER)) sections.push({ name, lines: [] });
      sections[sections.length - 1].lines.push(line);
    }
    return sections.map((section, index) => {
      if (index === 0) return section;
      const mixin = section.lines.join("\n").match(/^@mixin\s+([\w-]+)/m)?.[1];
      return { ...section, name: `${name} (${mixin ?? `patch ${index}`})` };
    });
  });
  return [...partials, ...vendored];
}

// Lightning CSS merges only adjacent `(any-hover: hover)` blocks, so hover
// rules scattered through a partial each ship their own block. A partial
// (or a vendored patch) gets one, at the end of its mixin. This replaces a
// single ceiling on the compiled sheet's total, which every new component
// raised by one and every pair of branches conflicted on.
//
// Exact counts for what predates the rule, as in conventions.test.ts: lower
// one when you merge two blocks, never raise it. Each extra block stays
// where moving its rules into the first would reorder them against an
// equal-specificity rule in between.
const KNOWN_EXTRA_BLOCKS: Record<string, number> = {
  // The header's block stays ahead of the stepper's `:active::after` and
  // disabled `::after` rules; the day block stays ahead of the range states.
  "_date-picker-calendar.scss": 3,
  // The invalid field, the neutral divider, the disabled steppers and the
  // readonly field, each beside the resting rule it overrides.
  "_fluid-number-input.scss": 5,
  // Upstream's hover rules, guarded where they stand among the unguarded
  // rules around them.
  "components/data-table/_data-table-action.scss": 3,
  "components/data-table/_data-table-core.scss": 5,
  "components/overflow-menu/_overflow-menu.scss": 3,
  "components/tag/_tag.scss": 2,
  "components/text-input/_text-input.scss": 2,
  "components/ui-shell/_side-nav.scss": 7,
  // One patch that declares four mixins: the disabled container, dismissible
  // tabs, and the vertical row and column.
  "components/tabs/_tabs.scss (tabs-icon)": 4,
};

describe("any-hover media query grouping", () => {
  it("holds at most one grouped hover block per partial", () => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const { name, lines } of units()) {
      const count = lines.filter((line) => HOVER_BLOCK.test(line)).length;
      total += count;
      if (count > 1) counts[name] = count;
    }
    // Fails if the pattern stops matching, so the rule can't pass vacuously.
    expect(total).toBeGreaterThan(40);
    expect(counts).toEqual(KNOWN_EXTRA_BLOCKS);
  });
});
