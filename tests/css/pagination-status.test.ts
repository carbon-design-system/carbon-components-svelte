// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(
    __dirname,
    "../../css/vendor/carbon-components/scss/components/pagination/_pagination.scss",
  ),
  "utf8",
);

describe("pagination status text", () => {
  it("indents only the items count inside the pagination's left group", () => {
    // A standalone `PaginationStatus` carries `bx--pagination__text` outside
    // `__left`, so the gap after the page-size select must not ride on the
    // bare `span.bx--pagination__text` rule.
    const textRule = source.match(
      /span\.#\{\$prefix\}--pagination__text \{[^}]*\}/,
    )?.[0];
    expect(textRule).toBeDefined();
    expect(textRule).not.toMatch(/margin-left/);

    const countRule = source.match(
      /\.#\{\$prefix\}--pagination__left \.#\{\$prefix\}--pagination__items-count \{[^}]*\}/,
    )?.[0];
    expect(countRule).toMatch(/margin-left: \$carbon--spacing-05;/);
  });
});
