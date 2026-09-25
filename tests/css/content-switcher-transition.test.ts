// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FILE = join(
  __dirname,
  "../../css/vendor/carbon-components/scss/components/content-switcher/_content-switcher.scss",
);

describe("content-switcher transition", () => {
  it("bx--content-switcher-btn lists its animated properties explicitly", () => {
    const css = readFileSync(FILE, "utf8");
    const rule = css.match(
      /\.#\{\$prefix\}--content-switcher-btn \{([\s\S]*?)\n {4}&::after/,
    );
    expect(rule).not.toBeNull();
    const body = rule?.[1] ?? "";
    expect(body).not.toMatch(/transition:\s*all\b/);
    expect(body).toMatch(/transition:\s*background-color/);
    expect(body).toMatch(/color \$duration--moderate-01/);
    // Focus ring lives on border-color/box-shadow; those must snap, not fade.
    expect(body).not.toMatch(/border-color \$duration--moderate-01/);
    expect(body).not.toMatch(/box-shadow \$duration--moderate-01/);
  });
});
