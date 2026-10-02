// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

describe("vertical slider layout", () => {
  it("fills the parent height and pins range labels to the track ends", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const find = (selector: string) =>
      rules.find((r) => r.selector === selector);

    expect(find(".bx--slider-form-item--vertical")?.decls.get("height")).toBe(
      "100%",
    );

    const container = find(".bx--slider-container--vertical");
    expect(container?.decls.get("display")).toBe("grid");
    expect(container?.decls.get("flex")).toMatch(/^1 1 /);
    // Single slider: the text input gets its own row below the track.
    expect(container?.decls.get("grid-template-areas")).toMatch(
      /"input input"$/,
    );
    expect(
      find(
        ".bx--slider-container--vertical>.bx--slider-text-input-wrapper",
      )?.decls.get("grid-area"),
    ).toBe("input");

    // Range slider: each input pairs with the end it bounds.
    const twoHandlesVertical = find(
      ".bx--slider-container--vertical.bx--slider-container--two-handles",
    );
    expect(twoHandlesVertical?.decls.get("grid-template-areas")).toContain(
      '"track max upper"',
    );
    expect(twoHandlesVertical?.decls.get("grid-template-areas")).toContain(
      '"track min lower"',
    );

    const track = find(".bx--slider--vertical");
    expect(track?.decls.get("height")).toBe("auto");
    expect(track?.decls.get("grid-area")).toBe("track");

    expect(
      find(
        ".bx--slider-container--vertical>.bx--slider__range-label:last-of-type",
      )?.decls.get("grid-area"),
    ).toBe("max");
    expect(
      find(
        ".bx--slider-container--vertical>.bx--slider__range-label:first-of-type",
      )?.decls.get("grid-area"),
    ).toBe("min");

    // Must beat the horizontal two-handle `display: flex; gap` rule.
    const twoHandles = find(".bx--slider-container--two-handles");
    expect(container?.order).toBeGreaterThan(
      twoHandles?.order ?? Number.POSITIVE_INFINITY,
    );
  }, 30_000);
});
