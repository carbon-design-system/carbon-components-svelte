import { observeResize } from "../../../src/viz/utils/resize-pool.js";

type Entry = {
  target: Element;
  contentRect: { width: number; height: number };
};

let instances: FakeObserver[] = [];

class FakeObserver {
  observed = new Set<Element>();
  disconnected = false;
  callback: (entries: Entry[]) => void;
  constructor(callback: (entries: Entry[]) => void) {
    this.callback = callback;
    instances.push(this);
  }
  observe(node: Element) {
    this.observed.add(node);
  }
  unobserve(node: Element) {
    this.observed.delete(node);
  }
  disconnect() {
    this.disconnected = true;
  }
  resize(node: Element, width: number, height = 100) {
    this.callback([{ target: node, contentRect: { width, height } }]);
  }
}

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

beforeEach(() => {
  instances = [];
  vi.stubGlobal("ResizeObserver", FakeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("observeResize", () => {
  test("shares one observer across every node", () => {
    const stops = Array.from({ length: 50 }, () =>
      observeResize(document.createElement("div"), () => {}),
    );

    expect(instances).toHaveLength(1);
    expect(instances[0].observed.size).toBe(50);
    for (const stop of stops) stop();
  });

  test("delivers the latest size once per frame, to the right callback", async () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    const onA = vi.fn();
    const onB = vi.fn();
    const stopA = observeResize(a, onA);
    const stopB = observeResize(b, onB);

    instances[0].resize(a, 300);
    instances[0].resize(a, 320);
    instances[0].resize(b, 500);
    expect(onA).not.toHaveBeenCalled();

    await nextFrame();
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onA).toHaveBeenCalledWith(320, 100);
    expect(onB).toHaveBeenCalledWith(500, 100);
    stopA();
    stopB();
  });

  test("stops delivering after the node is released, even mid-frame", async () => {
    const node = document.createElement("div");
    const callback = vi.fn();
    const stop = observeResize(node, callback);
    const keep = observeResize(document.createElement("div"), () => {});

    instances[0].resize(node, 300);
    stop();
    await nextFrame();
    expect(callback).not.toHaveBeenCalled();
    expect(instances[0].observed.has(node)).toBe(false);
    keep();
  });

  test("disconnects with the last node and starts fresh afterwards", () => {
    const stop = observeResize(document.createElement("div"), () => {});
    stop();
    stop();
    expect(instances[0].disconnected).toBe(true);

    const again = observeResize(document.createElement("div"), () => {});
    expect(instances).toHaveLength(2);
    again();
  });

  test("does nothing where ResizeObserver is unavailable", () => {
    vi.stubGlobal("ResizeObserver", undefined);

    expect(() =>
      observeResize(document.createElement("div"), () => {})(),
    ).not.toThrow();
    expect(instances).toHaveLength(0);
  });
});
