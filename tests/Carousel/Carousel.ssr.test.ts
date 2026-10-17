// @vitest-environment node
import Carousel from "carbon-components-svelte/Carousel/Carousel.svelte";
import { renderRaw } from "../utils/ssr";

describe("Carousel server render", () => {
  const props = { id: "gallery" };

  it("renders identical markup for an explicit id", () => {
    expect(renderRaw(Carousel, props)).toBe(renderRaw(Carousel, props));
  });

  it("derives the viewport id from the id", () => {
    const html = renderRaw(Carousel, props);

    expect(html).toContain('id="gallery-viewport"');
    expect(html.match(/aria-controls="gallery-viewport"/g)).toHaveLength(2);
    expect(html).toContain('id="gallery"');
  });
});
