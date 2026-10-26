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

  const render = (props: Record<string, unknown> = {}) =>
    renderSSR(CarouselWithSlides, props).document;

  // A slide is out of sight when `hidden`, or stacked invisibly in the
  // viewport's one grid cell (with `useMaxHeight`, the default).
  const hiddenSlides = (props: Record<string, unknown> = {}) =>
    [...render(props).querySelectorAll(".bx--carousel__item")].map(
      (slide) =>
        slide.hasAttribute("hidden") ||
        slide.classList.contains("bx--carousel__item--stacked"),
    );

  it("shows only the first slide by default", () => {
    expect(hiddenSlides()).toEqual([false, true, true]);
  });

  it("shows only the selected slide", () => {
    expect(hiddenSlides({ selectedIndex: 1 })).toEqual([true, false, true]);
    expect(hiddenSlides({ selectedIndex: 2 })).toEqual([true, true, false]);
  });

  it("shows the first slide for a negative index", () => {
    expect(hiddenSlides({ selectedIndex: -1 })).toEqual([false, true, true]);
  });

  it("stacks the slides to the tallest one with useMaxHeight", () => {
    const document = render();

    expect(document.querySelector(".bx--carousel__viewport")).toHaveClass(
      "bx--carousel__viewport--stacked",
    );
    expect(
      document.querySelectorAll(".bx--carousel__item[hidden]"),
    ).toHaveLength(0);
  });

  it("hides the other slides without useMaxHeight", () => {
    const document = render({ useMaxHeight: false });

    expect(document.querySelector(".bx--carousel__viewport")).not.toHaveClass(
      "bx--carousel__viewport--stacked",
    );
    expect(
      [...document.querySelectorAll(".bx--carousel__item")].map((slide) =>
        slide.hasAttribute("hidden"),
      ),
    ).toEqual([false, true, true]);
  });

  const buttons = (props: Record<string, unknown> = {}) => {
    const document = render(props);
    return ["previous", "next"].map((edge) =>
      document
        .querySelector(`.bx--carousel__button--${edge}`)
        ?.hasAttribute("disabled"),
    );
  };

  it("enables the buttons the slide count allows", () => {
    expect(buttons()).toEqual([true, false]);
    expect(buttons({ selectedIndex: 1 })).toEqual([false, false]);
    expect(buttons({ selectedIndex: 2 })).toEqual([false, true]);
    expect(buttons({ wrap: true })).toEqual([false, false]);
    expect(buttons({ single: true })).toEqual([true, true]);
  });

  it("renders the counter", () => {
    const document = render({ showCounter: true, selectedIndex: 1 });

    expect(document.querySelector(".bx--carousel__counter")).toHaveTextContent(
      "2 of 3",
    );
  });
});
