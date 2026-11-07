export type InputLayerSegment = {
  /** The characters of the run. Drawn as text, never as markup. */
  text: string;
  /** Classes for the run's `<span>`. */
  className?: string;
  /**
   * Text that is not in the field's value, such as a suggestion after the
   * caret. Drawn after the value and not counted in the characters that
   * `caretRect` and `rangeRects` index. See `InputLayer.ghostShifts`.
   */
  ghost?: boolean;
};

/** A box in viewport coordinates, as `getBoundingClientRect()` returns. */
export type TextRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type InputLayerOptions = {
  /**
   * `"behind"` draws under the field's text: the field's fill moves to the
   * layer and the field's own text stays visible. `"above"` draws over it
   * and ignores the pointer.
   * @default "behind"
   */
  position?: "behind" | "above";
  /**
   * Whose glyphs are seen. `"layer"` makes the field's own text transparent
   * and draws it, in color, from the layer above the field. Forced colors
   * give the glyphs back to the field. Implies `position: "above"`.
   * @default "field"
   */
  ink?: "field" | "layer";
  /**
   * Cut the value into runs. Called on every `input`, by `update()` and when
   * the layer is created. By default the layer holds the value as one run.
   */
  segments?: (value: string) => ReadonlyArray<InputLayerSegment>;
  /** Classes for the layer's root. */
  className?: string;
  /**
   * Where the layer is added, as the last child. Defaults to the field's
   * parent, which must be positioned.
   */
  container?: HTMLElement;
};

export type InputLayer = {
  /** The layer's root element. */
  element: HTMLElement;
  /** The element that holds the runs. */
  content: HTMLElement;
  /** Draw runs, as text nodes only. */
  render: (segments: ReadonlyArray<InputLayerSegment>) => void;
  /**
   * Draw the field's value again, with new `segments` if given. Call it
   * after setting `value` from code, which fires no event.
   */
  update: (segments?: InputLayerOptions["segments"]) => void;
  /** Measure and place the layer now. */
  sync: () => void;
  /**
   * Whether the `ghost` segments, laid out after the value, move the value's
   * own text: the line is aligned to the end the ghost grows towards (Latin
   * text in an RTL field sits against the right edge), or a word that no
   * longer fits wraps. The field's text does not move, so a ghost that moves
   * the layer's would not sit where the caret is. Costs two layouts.
   */
  ghostShifts: () => boolean;
  /** See `caretRect`. */
  caretRect: (index: number) => TextRect | null;
  /** See `rangeRects`. */
  rangeRects: (start: number, end: number) => TextRect[];
  /** Remove the layer and give the field back. */
  destroy: () => void;
};

/**
 * Add a layer of text behind or over `field`, lined up with the field's own
 * text. The field keeps its caret, selection, IME, spell check, undo and form
 * value. The layer is `aria-hidden` and ignores the pointer.
 */
export function createInputLayer(
  field: HTMLInputElement | HTMLTextAreaElement,
  options?: InputLayerOptions,
): InputLayer;

/**
 * Svelte action form of `createInputLayer`. Pass `value` too, and the layer
 * draws again whenever the app changes it from code.
 */
export function inputLayer(
  node: HTMLInputElement | HTMLTextAreaElement,
  options?: InputLayerOptions & { value?: string },
): {
  update: (options?: InputLayerOptions & { value?: string }) => void;
  destroy: () => void;
};

/**
 * Where the caret sits before character `index` of a field's value, in
 * viewport coordinates, as the field is scrolled now: a box of zero width,
 * as tall as the line. `null` where there is no layout.
 */
export function caretRect(
  field: HTMLInputElement | HTMLTextAreaElement,
  index: number,
): TextRect | null;

/**
 * Where the characters `start` to `end` of a field's value are drawn, in
 * viewport coordinates: one box for each line they touch.
 */
export function rangeRects(
  field: HTMLInputElement | HTMLTextAreaElement,
  start: number,
  end: number,
): TextRect[];
