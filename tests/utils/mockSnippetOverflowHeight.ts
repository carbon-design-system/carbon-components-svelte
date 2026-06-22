const COLLAPSED_HEIGHT = 16 * 15;

/**
 * jsdom does not lay out text, so CodeSnippet's overflow measurement always
 * sees height 0. Mock the `<pre>` height so expand/collapse tests can run.
 */
export function mockSnippetOverflowHeight(height = COLLAPSED_HEIGHT + 1) {
  const original = Element.prototype.getBoundingClientRect;

  return vi
    .spyOn(Element.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: Element) {
      if (this.tagName === "PRE") {
        return {
          height,
          width: 100,
          top: 0,
          left: 0,
          right: 100,
          bottom: height,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      }

      return original.call(this);
    });
}

export async function waitForSnippetMeasurement() {
  await Promise.resolve();
}
