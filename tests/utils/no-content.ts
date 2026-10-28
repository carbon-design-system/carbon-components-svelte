/**
 * Asserts that an element shows nothing: no child elements and no text
 * but whitespace.
 *
 * Use this, not `toBeEmptyDOMElement`. Svelte 3 and 4 keep the whitespace
 * text nodes around a block that renders nothing, so an element that
 * looks empty fails that matcher in the compat harnesses.
 */
export function expectNoContent(element: Element | null) {
  assert(element);
  expect({
    children: [...element.children].map((child) => child.outerHTML),
    text: element.textContent?.trim(),
  }).toEqual({ children: [], text: "" });
}
