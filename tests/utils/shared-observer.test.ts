import {
  observeIntersection,
  observeResize,
} from "../../src/utils/shared-observer.js";

type Entry = { target: Element };

/** A fake observer that records calls and delivers entries on demand. */
function createFakeObserver() {
  const instances: FakeObserver[] = [];
  class FakeObserver {
    callback: (entries: Entry[]) => void;
    options: unknown;
    observed = new Set<Element>();
    calls: string[] = [];
    constructor(callback: (entries: Entry[]) => void, options?: unknown) {
      this.callback = callback;
      this.options = options;
      instances.push(this);
    }
    observe(element: Element) {
      this.observed.add(element);
      this.calls.push("observe");
    }
    unobserve(element: Element) {
      this.observed.delete(element);
      this.calls.push("unobserve");
    }
    disconnect() {
      this.observed.clear();
    }
    fire(...targets: Element[]) {
      this.callback(targets.map((target) => ({ target })));
    }
  }
  return { FakeObserver, instances };
}

describe("observeResize", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shares one observer and delivers each element's entries in one batch", () => {
    const { FakeObserver, instances } = createFakeObserver();
    vi.stubGlobal("ResizeObserver", FakeObserver);
    const a = document.createElement("div");
    const b = document.createElement("div");
    const order: string[] = [];

    const stopA = observeResize(a, () => order.push("a"));
    const stopB = observeResize(b, () => order.push("b"));

    expect(instances).toHaveLength(1);
    instances[0].fire(a, b);
    expect(order).toEqual(["a", "b"]);

    stopA();
    stopB();
    expect(instances[0].observed.size).toBe(0);
  });

  it("re-observes for a second subscriber and unobserves after the last", () => {
    const { FakeObserver, instances } = createFakeObserver();
    vi.stubGlobal("ResizeObserver", FakeObserver);
    const el = document.createElement("div");
    const first = vi.fn();
    const second = vi.fn();

    const stopFirst = observeResize(el, first);
    const stopSecond = observeResize(el, second);
    // The second subscriber re-observes, which queues a fresh initial entry.
    expect(instances[0].calls).toEqual(["observe", "unobserve", "observe"]);

    instances[0].fire(el);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    stopFirst();
    stopFirst();
    expect(instances[0].observed.has(el)).toBe(true);
    stopSecond();
    expect(instances[0].observed.has(el)).toBe(false);
  });

  it("keeps two subscriptions of the same callback separate", () => {
    const { FakeObserver, instances } = createFakeObserver();
    vi.stubGlobal("ResizeObserver", FakeObserver);
    const el = document.createElement("div");
    const callback = vi.fn();

    const stopFirst = observeResize(el, callback);
    const stopSecond = observeResize(el, callback);
    stopFirst();

    instances[0].fire(el);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(instances[0].observed.has(el)).toBe(true);

    stopSecond();
    expect(instances[0].observed.has(el)).toBe(false);
  });

  it("keeps delivering when a callback throws, then reports the error", () => {
    vi.useFakeTimers();
    try {
      const { FakeObserver, instances } = createFakeObserver();
      vi.stubGlobal("ResizeObserver", FakeObserver);
      const a = document.createElement("div");
      const b = document.createElement("div");
      const after = vi.fn();

      observeResize(a, () => {
        throw new Error("boom");
      });
      observeResize(b, after);

      instances[0].fire(a, b);
      expect(after).toHaveBeenCalledTimes(1);
      expect(() => vi.runAllTimers()).toThrow("boom");
    } finally {
      vi.useRealTimers();
    }
  });

  it("does nothing without ResizeObserver", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const stop = observeResize(document.createElement("div"), vi.fn());
    expect(() => stop()).not.toThrow();
  });
});

describe("observeIntersection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shares one observer per rootMargin and threshold", () => {
    const { FakeObserver, instances } = createFakeObserver();
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    const a = document.createElement("div");
    const b = document.createElement("div");
    const c = document.createElement("div");

    observeIntersection(a, vi.fn(), { rootMargin: "600px" });
    observeIntersection(b, vi.fn(), { rootMargin: "600px" });
    observeIntersection(c, vi.fn());

    expect(instances).toHaveLength(2);
    expect(instances[0].options).toEqual({ rootMargin: "600px", threshold: 0 });
    expect(instances[0].observed).toEqual(new Set([a, b]));
    expect(instances[1].options).toEqual({ rootMargin: "0px", threshold: 0 });
  });
});
