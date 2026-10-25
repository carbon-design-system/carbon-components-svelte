// @vitest-environment node
import Carousel from "carbon-components-svelte/Carousel/Carousel.svelte";
import { renderRaw, renderSSR } from "../utils/ssr";
import CarouselWithSlides from "./Carousel.test.svelte";

describe("Carousel server render", () => {
  const props = { id: "gallery" };

  it("derives the viewport id from the id", () => {
    const html = renderRaw(Carousel, props);

    expect(html).toContain('id="gallery-viewport"');
    expect(html.match(/aria-controls="gallery-viewport"/g)).toHaveLength(2);
    expect(html).toContain('id="gallery"');
  });

  it("omits the slide label until the position is known", () => {
    expect(renderRaw(CarouselWithSlides)).not.toContain("Slide 0 of 0");
  });

  const hiddenSlides = (selectedIndex?: number) => {
    const { document } = renderSSR(
      CarouselWithSlides,
      selectedIndex === undefined ? {} : { selectedIndex },
    );
    return [...document.querySelectorAll(".bx--carousel__item")].map((slide) =>
      slide.hasAttribute("hidden"),
    );
  };

  it("shows only the first slide by default", () => {
    expect(hiddenSlides()).toEqual([false, true, true]);
  });

  it("shows only the selected slide", () => {
    expect(hiddenSlides(1)).toEqual([true, false, true]);
    expect(hiddenSlides(2)).toEqual([true, true, false]);
  });

  it("shows the first slide for a negative index", () => {
    expect(hiddenSlides(-1)).toEqual([false, true, true]);
  });
});
