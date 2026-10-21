/** A recording `IntersectionObserver` whose callbacks the test fires by hand. */
export class IntersectionObserverMock {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  elements = new Set<Element>();

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.options = options;
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }

  /** Delivers one entry for `target` to the observer's callback. */
  trigger(target: Element, isIntersecting: boolean) {
    this.callback(
      [{ target, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

/**
 * Stubs `IntersectionObserver` with a fresh class (shared observers are cached
 * per constructor, so each stub starts clean) and returns every instance it
 * constructs, in creation order.
 */
export function stubIntersectionObserver() {
  const instances: IntersectionObserverMock[] = [];

  vi.stubGlobal(
    "IntersectionObserver",
    class extends IntersectionObserverMock {
      constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        super(callback, options);
        instances.push(this);
      }
    },
  );

  return { instances };
}
