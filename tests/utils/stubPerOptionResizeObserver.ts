/// <reference types="vitest/globals" />

/**
 * Letting a rendered listbox option report a height in the unit environment.
 *
 * jsdom lays nothing out, so every real height is zero and no
 * `ResizeObserver` ever fires. The height each option should report travels on
 * the option itself, in a `data-measured-height` attribute the component's
 * fixture puts there, and the stub below reads it back. That is the only way a
 * height held against the wrong option is observable at all.
 *
 * Shared because `ComboBox` and `MultiSelect` both render real components
 * through their measured fixtures. Anything a single suite drives belongs in
 * that suite.
 */

/** The height the option's fixture says it renders at. */
function readMarkedHeight(element: Element) {
  const marker = element.querySelector("[data-measured-height]");
  return Number(marker?.getAttribute("data-measured-height") ?? 0);
}

/** A resize entry reporting the height the option carries. */
function entryFor(element: Element) {
  const height = readMarkedHeight(element);
  return {
    target: element,
    contentRect: { height } as DOMRectReadOnly,
    borderBoxSize: [{ blockSize: height, inlineSize: 0 }],
    contentBoxSize: [],
    devicePixelContentBoxSize: [],
  };
}

/**
 * Stub `ResizeObserver` so each option reports the height it carries, rather
 * than the suite-wide stub's one height for everything. Batches are delivered
 * on their own, deferred like the real observer so the first paint still
 * happens against unmeasured state.
 */
export function stubPerOptionResizeObserver() {
  class PerOptionResizeObserver {
    callback: ResizeObserverCallback;
    elements = new Set<Element>();

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(element: Element) {
      this.elements.add(element);
      queueMicrotask(() => {
        if (!this.elements.has(element)) return;
        this.callback(
          [entryFor(element)] as unknown as ResizeObserverEntry[],
          this as unknown as ResizeObserver,
        );
      });
    }

    unobserve(element: Element) {
      this.elements.delete(element);
    }

    disconnect() {
      this.elements.clear();
    }
  }

  vi.stubGlobal("ResizeObserver", PerOptionResizeObserver);
}
