/**
 * True when `event.target` is outside every element in `elements`.
 * Skips falsy entries. Returns false when `event.target` is not a Node.
 */
export function isOutsideClick(
  event: Event,
  elements:
    | Element
    | null
    | undefined
    | false
    | Array<Element | null | undefined | false>,
): boolean;
