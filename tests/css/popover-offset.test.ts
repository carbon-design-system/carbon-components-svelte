import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(__dirname, "../../css/_popover.scss"), "utf8");

describe("popover offset", () => {
  it("offsets every placement through --cds-popover-offset", () => {
    // `right-top` alone used a Sass constant (8px), so a popover without a
    // caret sat 8px off its trigger while the other eleven placements were
    // flush, and `--cds-popover-offset` overrides skipped it.
    const placements = [
      ...source.matchAll(
        /--popover--(?:top|right|bottom|left)(?:-\w+)? \{[^}]*transform: ([^;]+);/g,
      ),
    ];
    expect(placements).toHaveLength(12);
    for (const [, transform] of placements) {
      expect(transform).toContain("var(--cds-popover-offset)");
    }
  });
});
