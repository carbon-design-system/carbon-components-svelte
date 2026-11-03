import type { MaskPattern, MaskResult } from "./input-mask.js";

/** What the `mask` action reports after the text of a field changes. */
export interface MaskChangeDetail extends MaskResult {
  /** The field that changed. */
  field: HTMLInputElement | HTMLTextAreaElement;
}

/** Params for the `mask` action. */
export interface MaskParams {
  /**
   * The pattern, or a function from the characters entered so far to the
   * pattern for them (a card number's grouping by prefix).
   *
   * `9` digit, `A` letter (upper-cased), `a` letter (lower-cased), `*`
   * letter or digit, `X` letter or digit (upper-cased). `\` before a
   * character makes it a literal. Every other character is a literal.
   */
  pattern: MaskPattern;
  /**
   * Write the literals up to the next slot as soon as the previous slot is
   * filled (`12/` after typing the month). By default a literal appears only
   * when the next character needs it.
   * @default false
   */
  eager?: boolean;
  /**
   * Which fields inside the element the mask applies to. Ignored when the
   * action is on the field itself.
   * @default "input, textarea"
   */
  selector?: string;
  /**
   * Called when the formatted text, the raw value or completeness changes,
   * and once for the text a field starts with.
   */
  onchange?: (detail: MaskChangeDetail) => void;
}

/**
 * Masks the text fields in or on the element. The browser keeps its undo
 * history, and the fields fire the same `input` and `change` events as
 * unmasked ones. SSR-safe.
 */
export function mask(
  node: HTMLElement,
  params: MaskParams,
): { update: (params: MaskParams) => void; destroy: () => void };
