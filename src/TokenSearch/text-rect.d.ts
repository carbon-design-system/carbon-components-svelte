/**
 * The box of the character at `offset` in the text of `root`, counted over
 * all its text nodes in order. At the end of the text, the box of the last
 * character, with `after` set. `null` when `root` holds no text.
 */
export function textRectAt(
  root: Element,
  offset: number,
): { rect: DOMRect; after: boolean } | null;
