import { readFileSync } from "node:fs";
import { join } from "node:path";

const fluidSource = readFileSync(
  join(__dirname, "../../css/_fluid-date-picker.scss"),
  "utf8",
);

describe("fluid date picker invalid outline", () => {
  it("only draws the container-level invalid outline inside range, not single/simple", () => {
    // Single/simple has exactly one `.date-picker-container`, coincident
    // with the outer `.date-picker--fluid` wrapper's own box (give or take
    // the 1px border-block-end the invalid `.date-picker` adds below it).
    // Outlining both draws two near-identical red rectangles a pixel apart
    // — a visible doubled border, worst on the bottom edge. Range still
    // needs its own container-level outline to call out which one of its
    // two inputs is invalid, since the wrapper's outline spans both sides.
    const match = fluidSource.match(
      /\.#\{\$prefix\}--date-picker--fluid\.#\{\$prefix\}--date-picker--fluid--invalid,\s*([\s\S]*?)\{\s*@include focus-outline\("invalid"\);/,
    );
    expect(match).not.toBeNull();
    const containerSelector = match?.[1] ?? "";
    expect(containerSelector).toContain("date-picker-container");
    expect(containerSelector).toContain("date-picker--range");
  });
});
