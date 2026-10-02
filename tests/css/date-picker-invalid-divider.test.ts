import { readFileSync } from "node:fs";
import { join } from "node:path";

const fluidSource = readFileSync(
  join(__dirname, "../../css/_fluid-date-picker.scss"),
  "utf8",
);

describe("fluid date picker invalid divider", () => {
  it("gives invalid single/simple inputs the same divider warn keeps above its message", () => {
    const match = fluidSource.match(
      /\.#\{\$prefix\}--date-picker__input--invalid,\s*([\s\S]*?)\{\s*border-block-end: 1px solid \$ui-04;/,
    );
    expect(match).not.toBeNull();
    const secondSelector = match?.[1] ?? "";
    expect(secondSelector).toContain("date-picker--single");
    expect(secondSelector).toContain("date-picker__input--invalid");
  });
});
