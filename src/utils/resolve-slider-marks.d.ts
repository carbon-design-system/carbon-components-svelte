/**
 * Resolve Slider / RangeSlider `marks` into a list of tick positions.
 */

export type SliderMark = { value: number; label?: string };

/**
 * Resolve `marks` into tick entries within `[min, max]`.
 * `true` generates a tick at every `step` from `min` through `max`.
 * An array is filtered to values in range. Falsy values yield no marks.
 */
export function resolveSliderMarks(
  marks: boolean | ReadonlyArray<SliderMark> | null | undefined,
  min: number,
  max: number,
  step: number,
): SliderMark[];
