/** Appends a `tag` element to `document.body`, runs `fn` with it, and always removes it, even when `fn` throws. */
export async function withOutsideElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  fn: (element: HTMLElementTagNameMap[K]) => void | Promise<void>,
): Promise<void> {
  const element = document.createElement(tag);
  document.body.appendChild(element);
  try {
    await fn(element);
  } finally {
    element.remove();
  }
}
