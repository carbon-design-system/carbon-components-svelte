// @vitest-environment node
import Carousel from "carbon-components-svelte/Carousel/Carousel.svelte";
import { render } from "svelte/server";

/** Server output with only Svelte's hydration comments removed. */
function renderRaw(props: Record<string, unknown>) {
  return render(Carousel, { props }).body.replace(/<!--[\s\S]*?-->/g, "");
}

describe("Carousel server render", () => {
  const props = { id: "gallery" };

  it("renders identical markup for an explicit id", () => {
    expect(renderRaw(props)).toBe(renderRaw(props));
  });

  it("derives the viewport id from the id", () => {
    const html = renderRaw(props);

    expect(html).toContain('id="gallery-viewport"');
    expect(html.match(/aria-controls="gallery-viewport"/g)).toHaveLength(2);
    expect(html).toContain('id="gallery"');
  });
});
