/** The class of a span that holds text that is not the field's. */
export const GHOST: string;

export type InputLayerSegment = {
  /** The characters of the run. */
  text: string;
  /** Classes for the run's `<span>`. */
  className?: string;
  /**
   * Text that is not in the field's value, such as a suggestion after the
   * caret. Drawn after the value and not counted in the characters that
   * `caretRect` and `rangeRects` index.
   */
  ghost?: boolean;
};

/**
 * Make the children of `parent` a `<span>` for each segment, reusing the
 * spans already there. The text is set as a text node, never as markup.
 * With `trailingBreak`, an empty text or one that ends in a newline gets a
 * final span with a zero width space, which keeps the empty last line of a
 * textarea and a line to measure a caret on.
 * Returns the text that was drawn.
 */
export function renderSegments(
  parent: Element,
  segments: ReadonlyArray<InputLayerSegment>,
  options?: { trailingBreak?: boolean },
): string;
