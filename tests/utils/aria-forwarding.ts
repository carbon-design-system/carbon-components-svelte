/**
 * Append an element with `id` and `text` to the body for a consumer
 * `aria-labelledby` to point at. It is removed when the test finishes.
 */
export function externalLabel(id: string, text: string) {
  const element = document.createElement("span");
  element.id = id;
  element.textContent = text;
  document.body.append(element);
  onTestFinished(() => element.remove());
  return element;
}
