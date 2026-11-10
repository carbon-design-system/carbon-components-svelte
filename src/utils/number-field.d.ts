import type { NumberFormatOptions } from "./number-format.js";

/** What the `numberFormat` action reports after the text of a field changes. */
export interface NumberFieldChangeDetail {
  /**
   * The number as a decimal string (`"-1234.5"`), or `""` for an empty field.
   * It has the digits that were entered: no exponent, no grouping.
   */
  value: string;
  /** `value` as a number, or `null` for an empty field. */
  number: number | null;
  /** The text as the field shows it. */
  text: string;
  /** The field that changed. */
  field: HTMLInputElement | HTMLTextAreaElement;
}

/** Params for the `numberFormat` action. */
export interface NumberFieldParams extends NumberFormatOptions {
  /**
   * Which fields inside the element the format applies to. Ignored when the
   * action is on the field itself.
   * @default "input, textarea"
   */
  selector?: string;
  /**
   * Called when the text or the number of a field changes, and once for the
   * text a field starts with.
   */
  onchange?: (detail: NumberFieldChangeDetail) => void;
}

/**
 * Formats the number typed into the text fields in or on the element for a
 * locale: grouping, decimal mark, currency or unit. The browser keeps its
 * undo history, and the fields fire the same `input` and `change` events as
 * unformatted ones. SSR-safe.
 */
export function numberFormat(
  node: HTMLElement,
  params: NumberFieldParams,
): { update: (params: NumberFieldParams) => void; destroy: () => void };
