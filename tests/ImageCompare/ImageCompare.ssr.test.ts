// @vitest-environment node
import ImageCompare from "carbon-components-svelte/ImageCompare/ImageCompare.svelte";
import { renderRaw } from "../utils/ssr";

describe("ImageCompare server render", () => {
  const props = { beforeSrc: "a.png", afterSrc: "b.png", value: 35 };

  it("writes the static frame: the position, the divider and both images", () => {
    const html = renderRaw(ImageCompare, props);

    expect(html).toContain("--ccs-image-compare-position: 35");
    expect(html).toContain('aria-valuenow="35"');
    expect(html).toContain('aria-valuetext="Showing 35% of Before"');
    expect(html).toContain('src="a.png"');
    expect(html).toContain('src="b.png"');
  });

  it("renders without the DOM in every mode", () => {
    for (const mode of ["slider", "side-by-side", "toggle"] as const) {
      expect(() => renderRaw(ImageCompare, { ...props, mode })).not.toThrow();
    }
  });

  it("serves the toggle's selected side before the script runs", () => {
    const html = renderRaw(ImageCompare, {
      ...props,
      mode: "toggle",
      selected: "after",
    });

    expect(html).toContain("bx--image-compare__layer--off");
  });
});
