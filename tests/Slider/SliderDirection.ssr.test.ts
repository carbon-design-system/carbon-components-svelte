// @vitest-environment node

import { trackPosition } from "../utils/slider-track";
import { renderSSR } from "../utils/ssr";
import SliderDirection from "./SliderDirection.ssr.test.svelte";

const LTR = {
  sliderThumb: "20%",
  rangeHandles: ["20%", "70%"],
  marks: ["25%"],
};

const RTL = {
  sliderThumb: "80%",
  rangeHandles: ["80%", "30%"],
  marks: ["75%"],
};

describe("Slider and RangeSlider server render under a plain dir", () => {
  // The styles read the nearest `dir`, so the markup sits right before the
  // script runs, with or without a LayoutDirection.
  it.each([
    ["rtl", undefined, RTL],
    ["ltr", undefined, LTR],
    ["ltr", "rtl", LTR],
    ["rtl", "ltr", RTL],
  ] as const)(
    "places dir=%s parts (LayoutDirection %s)",
    (dir, context, expected) => {
      const { document } = renderSSR(SliderDirection, { dir, context });
      const all = (selector: string) =>
        [...document.querySelectorAll<HTMLElement>(selector)].map(
          trackPosition,
        );
      const thumb = document.querySelector<HTMLElement>(
        ".bx--slider__thumb:not(.bx--slider__thumb--lower):not(.bx--slider__thumb--upper)",
      );
      assert(thumb);
      expect({
        sliderThumb: trackPosition(thumb),
        rangeHandles: all(".bx--slider__thumb-wrapper"),
        marks: all(".bx--slider__mark"),
      }).toEqual(expected);
    },
  );
});
