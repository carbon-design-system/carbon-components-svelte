import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import SliderDirection from "./SliderDirection.test.svelte";

/** Where each part sits from the track's left edge, as inline `left`. */
const positions = (container: HTMLElement) => {
  const left = (selector: string) =>
    [...container.querySelectorAll<HTMLElement>(selector)].map(
      (el) => el.style.left,
    );
  return {
    sliderThumb: screen.getByRole("slider", { name: "Replicas" }).style.left,
    rangeHandles: left(".bx--slider__thumb-wrapper"),
    marks: left(".bx--slider__mark"),
  };
};

/** The first thumb inside a `.bx--slider`. */
const firstThumb = (slider: HTMLElement) => {
  const thumb = slider.querySelector<HTMLElement>('[role="slider"]');
  assert(thumb);
  return thumb;
};

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

describe("Slider and RangeSlider writing direction", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("direction");
  });

  it("follows a LayoutDirection dir change", async () => {
    const { container, rerender } = render(SliderDirection);
    expect(positions(container)).toEqual(RTL);

    await rerender({ dir: "ltr" });
    expect(positions(container)).toEqual(LTR);

    await rerender({ dir: "rtl" });
    expect(positions(container)).toEqual(RTL);
  });

  it("lets a LayoutDirection win over the computed direction", () => {
    document.documentElement.style.direction = "rtl";
    const { container } = render(SliderDirection, { props: { dir: "ltr" } });
    expect(positions(container)).toEqual(LTR);
  });

  it("lets a plain dir inside a LayoutDirection win", async () => {
    const { container } = render(SliderDirection, {
      props: { innerDir: "ltr" },
    });
    await tick();
    expect(positions(container)).toEqual(LTR);

    const thumb = screen.getByRole("slider", { name: "Replicas" });
    await fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(thumb).toHaveAttribute("aria-valuenow", "21");

    const [lower] = screen.getAllByRole("slider", { name: /Window/ });
    await fireEvent.keyDown(lower, { key: "ArrowRight" });
    expect(lower).toHaveAttribute("aria-valuenow", "21");
  });

  it.each([
    [
      "the pointer enters",
      (slider: HTMLElement) => fireEvent.pointerEnter(slider),
    ],
    [
      "a thumb takes focus",
      (slider: HTMLElement) => fireEvent.focus(firstThumb(slider)),
    ],
    [
      "a key is pressed",
      (slider: HTMLElement) =>
        fireEvent.keyDown(firstThumb(slider), { key: "Shift" }),
    ],
  ])("re-reads a page direction change when %s", async (_trigger, interact) => {
    const { container } = render(SliderDirection, {
      props: { context: false },
    });
    expect(positions(container)).toEqual(LTR);

    // Nothing reports the change, so the sliders keep the old direction.
    document.documentElement.style.direction = "rtl";
    await tick();
    expect(positions(container)).toEqual(LTR);

    for (const slider of container.querySelectorAll<HTMLElement>(
      ".bx--slider",
    )) {
      // biome-ignore lint/performance/noAwaitInLoops: one slider at a time
      await interact(slider);
    }
    expect(positions(container)).toEqual(RTL);
  });

  it("moves the way an arrow key points right after a direction change", async () => {
    render(SliderDirection, { props: { context: false } });
    document.documentElement.style.direction = "rtl";

    const thumb = screen.getByRole("slider", { name: "Replicas" });
    await fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    expect(thumb).toHaveAttribute("aria-valuenow", "21");

    const [lower] = screen.getAllByRole("slider", { name: /Window/ });
    await fireEvent.keyDown(lower, { key: "ArrowLeft" });
    expect(lower).toHaveAttribute("aria-valuenow", "21");
  });
});
