// @vitest-environment node
import Carousel from "carbon-components-svelte/Carousel/Carousel.svelte";
import { renderRaw } from "../utils/ssr";
import CarouselWithSlides from "./Carousel.test.svelte";

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

  it("omits the slide label until the position is known", () => {
    expect(renderRaw(CarouselWithSlides)).not.toContain("Slide 0 of 0");
  });
});
