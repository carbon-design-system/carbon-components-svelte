// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const flatpickrSource = readFileSync(
  join(
    __dirname,
    "../../css/vendor/carbon-components/scss/components/date-picker/_flatpickr.scss",
  ),
  "utf8",
);

const fluidSource = readFileSync(
  join(__dirname, "../../css/_fluid-date-picker.scss"),
  "utf8",
);

describe("date picker calendar shadow", () => {
  it("keeps the shadow's upward bleed from reaching the input above it", () => {
    // `.flatpickr-calendar.open` sits flush (zero gap) below the date picker
    // input(s), so an unmodified `box-shadow: <x> <y> <blur> <color>` bleeds
    // `blur - y` px upward onto the input. The spread here must pull that
    // back in (spread <= y - blur) so nothing paints above the calendar's
    // own top edge, for every date picker type (not just range).
    const match = flatpickrSource.match(
      /\.flatpickr-calendar\.open \{[\s\S]*?box-shadow: (-?[\d.]+)\w* (-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px/,
    );
    expect(match).not.toBeNull();
    const [y, blur, spread] = (match?.slice(2) ?? []).map((value) =>
      Number.parseFloat(value),
    );
    expect(spread).toBeLessThanOrEqual(y - blur);
  });

  it("keeps the base calendar flush (zero gap) against the input", () => {
    // `top: calc(100% + 2px)` (on `.static`) and `margin-top` (on `.open`)
    // must cancel exactly. Every date picker's own border/outline lives
    // flush with its own box, so any real gap here reveals a sliver of blank
    // page background between the input and the calendar (most visible as a
    // seam cutting through an open, focused input's outline).
    const openMargin = flatpickrSource.match(
      /\.flatpickr-calendar\.open \{[\s\S]*?margin-top: to-rem\((-?[\d.]+)px\)/,
    );
    const staticTop = flatpickrSource.match(
      /\.flatpickr-calendar\.static \{[\s\S]*?top: calc\(100% \+ (\d+)px\)/,
    );
    expect(openMargin).not.toBeNull();
    expect(staticTop).not.toBeNull();
    const margin = Number.parseFloat(openMargin?.[1] ?? "");
    const topOffset = Number.parseFloat(staticTop?.[1] ?? "");
    expect(margin).toBe(-topOffset);
  });

  it("gives fluid range's calendar 1px of real clearance instead of the flush seam", () => {
    // Fluid range's container is a content-box flex column around a
    // (border-box, borderless) input, so the container renders 1px taller
    // than the input: the input's own height plus the container's
    // `border-block-end`. flatpickr anchors the calendar flush against the
    // input (its offsetParent), 1px short of the container's true bottom, so
    // the base flush seam lets the calendar overlap and paint over that
    // border on the non-focused field. This override must break the flush
    // seam by exactly that 1px.
    const match = fluidSource.match(
      /--date-picker--range\s*\.flatpickr-calendar\.open \{\s*margin-top: to-rem\((-?[\d.]+)px\)/,
    );
    expect(match).not.toBeNull();
    expect(Number.parseFloat(match?.[1] ?? "")).toBe(-1);
  });

  it("extends fluid range's focus outline to cover that same 1px border", () => {
    // The focus outline is drawn on the input's own box, which stops 1px
    // short of the container's border for the same reason as above. Without
    // this, focusing a fluid range field leaves a sliver of the container's
    // border visible below/outside the outline.
    const match = fluidSource.match(
      /--date-picker__input:focus \{\s*outline-offset: to-rem\((-?[\d.]+)px\)/,
    );
    expect(match).not.toBeNull();
    expect(Number.parseFloat(match?.[1] ?? "")).toBe(-1);
  });
});
