const SVELTE_ANIMATION = / animation: __svelte_[^;]*;/;

/** The elements and attributes of a node, without comments or the whitespace between tags. */
export function canonical(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent?.trim() ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const element = node as Element;
  const attributes = Array.from(element.attributes)
    // Svelte 3 and 4 leave a zero-length `animation` on an element that faded in.
    .map(
      ({ name, value }) => ` ${name}="${value.replace(SVELTE_ANIMATION, "")}"`,
    )
    .sort()
    .join("");
  const children = Array.from(element.childNodes).map(canonical).join("");
  return `<${element.localName}${attributes}>${children}</${element.localName}>`;
}

export const canonicalChildren = (container: Element) =>
  Array.from(container.childNodes).map(canonical).join("");
