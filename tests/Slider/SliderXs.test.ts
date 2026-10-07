import { render } from "@testing-library/svelte";
import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
import Slider from "carbon-components-svelte/Slider/Slider.svelte";
import SliderXs from "./SliderXs.test.svelte";

function inputs(container: HTMLElement) {
  return [...container.querySelectorAll(".bx--slider-text-input")];
}

describe("Slider xs size", () => {
  it("sizes the number input", () => {
    const { container } = render(Slider, {
      props: { labelText: "Replicas", size: "xs" },
    });

    expect(inputs(container)[0]).toHaveClass("bx--slider-text-input--xs");
  });

  it("sizes both range inputs", () => {
    const { container } = render(RangeSlider, {
      props: { labelText: "Window", size: "xs" },
    });

    expect(inputs(container)).toHaveLength(2);
    for (const input of inputs(container)) {
      expect(input).toHaveClass("bx--slider-text-input--xs");
    }
  });

  it.each([
    ["xs", true],
    ["sm", false],
    [undefined, false],
  ] as const)("follows a form size of %s", (formSize, xs) => {
    const { container } = render(SliderXs, { props: { formSize } });

    expect(inputs(container)).toHaveLength(3);
    for (const input of inputs(container)) {
      expect(input.classList.contains("bx--slider-text-input--xs")).toBe(xs);
    }
  });
});
