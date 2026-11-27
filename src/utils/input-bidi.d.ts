export type InputTextMetrics = {
  /** Width of the input's content box. */
  boxWidth: number;
  /** Width of the whole line of text. */
  textWidth: number;
  /** The input's `scrollLeft`. */
  scrollLeft: number;
  /** Whether the input's `direction` is `rtl`. */
  fieldRtl: boolean;
  /**
   * Whether the line reads right to left: the field's direction, unless the
   * line is `plaintext` or `dir="auto"`, which go by its first strong character.
   */
  textRtl: boolean;
  /** The input's computed `text-align`. */
  textAlign?: string;
};

/**
 * The direction of the first strongly directional character of `text`, as
 * `dir="auto"` and `unicode-bidi: plaintext` decide a line's direction.
 * `null` for a line with no strong letter.
 */
export function firstStrong(text: string): "rtl" | "ltr" | null;

/** Whether the first strong character of `text` runs right to left. */
export function startsRtl(text: string): boolean;

/**
 * Whether a line in a field reads right to left: the field's direction, or the
 * first strong character's when the line is `plaintext` or `dir="auto"`
 * (`auto`).
 */
export function paragraphIsRtl(
  text: string,
  fieldRtl: boolean,
  auto: boolean,
): boolean;

/**
 * The offset from the left edge of the content box to the left edge of the
 * line of text in an `<input>`. Text that fits is aligned by the field's
 * direction and `text-align`; text that overflows is anchored at the start
 * of the line's direction, and `scrollLeft` counts from there.
 */
export function inputTextOffset(metrics: InputTextMetrics): number;
