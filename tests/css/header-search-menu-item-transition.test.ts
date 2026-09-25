// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FILE = join(
  __dirname,
  "../../css/vendor/carbon-components/scss/components/ui-shell/_ui-shell.scss",
);

describe("header-search-menu-item transition", () => {
  it("lists its animated properties explicitly instead of `all`", () => {
    const css = readFileSync(FILE, "utf8");
    const rule = css.match(
      /\.#\{\$prefix\}--header-search-menu-item \{([\s\S]*?)\n {4}\}/,
    );
    expect(rule).not.toBeNull();
    const body = rule?.[1] ?? "";
    expect(body).not.toMatch(/transition:\s*all\b/);
    expect(body).toMatch(/transition:\s*background-color \$duration--fast-01/);
    expect(body).toMatch(/\n\s*color \$duration--fast-01/);
  });
});
