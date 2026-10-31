import {
  getScrollEdgeState,
  scrollEdges,
  type ScrollEdgeState,
} from "../../src/utils/scroll-edges.js";
import { nextFrame } from "./next-frame";

const metrics = {
  scrollLeft: 0,
  scrollTop: 0,
  scrollWidth: 100,
  scrollHeight: 100,
  clientWidth: 100,
  clientHeight: 100,
};

describe("getScrollEdgeState", () => {
  it("reports both edges reached when the content fits", () => {
    expect(getScrollEdgeState(metrics)).toEqual({
      isXScrollable: false,
      isYScrollable: false,
      atTop: true,
      atBottom: true,
      atStart: true,
      atEnd: true,
    });
  });

  it("ignores a 1px phantom overflow and honors the tolerance", () => {
    const phantom = { ...metrics, scrollHeight: 101 };
    expect(getScrollEdgeState(phantom).isYScrollable).toBe(false);
    expect(getScrollEdgeState(phantom, 0).isYScrollable).toBe(true);

    const nearBottom = { ...metrics, scrollHeight: 300, scrollTop: 198 };
    expect(getScrollEdgeState(nearBottom).atBottom).toBe(false);
    expect(getScrollEdgeState(nearBottom, 2).atBottom).toBe(true);
  });

  it("tracks each axis on its own", () => {
    const state = getScrollEdgeState({
      ...metrics,
      scrollWidth: 300,
      scrollLeft: 200,
      scrollHeight: 300,
      scrollTop: 0,
    });
    expect(state).toMatchObject({
      isXScrollable: true,
      isYScrollable: true,
      atStart: false,
      atEnd: true,
      atTop: true,
      atBottom: false,
    });
  });

  it("measures the inline edges from the start in RTL, where scrollLeft is negative", () => {
    const wide = { ...metrics, scrollWidth: 300 };
    // RTL scrolled to its start: the right edge, scrollLeft 0.
    expect(getScrollEdgeState(wide)).toMatchObject({
      atStart: true,
      atEnd: false,
    });
    // RTL scrolled to its end: the left edge, scrollLeft -200.
    expect(getScrollEdgeState({ ...wide, scrollLeft: -200 })).toMatchObject({
      atStart: false,
      atEnd: true,
    });
  });
});

type Entry = { target: Element };

/** A `ResizeObserver` whose batches this test delivers by hand. */
function installResizeObserver() {
  const instances: FakeResizeObserver[] = [];

  class FakeResizeObserver {
    observed = new Set<Element>();
    queued = new Set<Element>();
    callback: (entries: Entry[]) => void;
    constructor(callback: (entries: Entry[]) => void) {
      this.callback = callback;
      instances.push(this);
    }
    observe(element: Element) {
      this.observed.add(element);
      this.queued.add(element);
    }
    unobserve(element: Element) {
      this.observed.delete(element);
      this.queued.delete(element);
    }
  }

  vi.stubGlobal("ResizeObserver", FakeResizeObserver);

  return {
    get observers() {
      return instances;
    },
    get observed() {
      return new Set(instances.flatMap((i) => [...i.observed]));
    },
    /** Deliver the first entry of everything observed since the last call. */
    flush() {
      for (const instance of instances) {
        const entries = [...instance.queued].map((target) => ({ target }));
        instance.queued.clear();
        if (entries.length) instance.callback(entries);
      }
    },
    resize(target: Element) {
      for (const instance of instances) {
        if (instance.observed.has(target)) instance.callback([{ target }]);
      }
    },
  };
}

function setMetrics(node: HTMLElement, values: Partial<typeof metrics>) {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(node, key, { value, configurable: true });
  }
}

describe("scrollEdges action", () => {
  let node: HTMLElement;
  let resize: ReturnType<typeof installResizeObserver>;

  beforeEach(() => {
    resize = installResizeObserver();
    node = document.createElement("div");
    node.append(document.createElement("p"), document.createElement("p"));
    document.body.append(node);
    setMetrics(node, { ...metrics, scrollHeight: 300, clientHeight: 100 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("reports once from the shared observer's first delivery, not on creation", () => {
    const onChange = vi.fn();
    const action = scrollEdges(node, { onChange });
    expect(onChange).not.toHaveBeenCalled();

    resize.flush();
    // The scroller and both children each deliver; only one report.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({
      isYScrollable: true,
      atTop: true,
      atBottom: false,
    });

    action.destroy();
  });

  it("shares one ResizeObserver and observes the scroller and each child", () => {
    const action = scrollEdges(node, { onChange: vi.fn() });
    scrollEdges(document.createElement("div"), { onChange: vi.fn() });

    expect(resize.observers).toHaveLength(1);
    expect(resize.observed.has(node)).toBe(true);
    expect(resize.observed.has(node.children[0])).toBe(true);
    expect(resize.observed.has(node.children[1])).toBe(true);

    action.destroy();
  });

  it("reports a scroll change once per frame and skips an unchanged state", async () => {
    const onChange = vi.fn();
    const action = scrollEdges(node, { onChange });
    resize.flush();
    onChange.mockClear();

    setMetrics(node, { scrollTop: 100 });
    node.dispatchEvent(new Event("scroll"));
    setMetrics(node, { scrollTop: 150 });
    node.dispatchEvent(new Event("scroll"));
    await nextFrame();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({
      atTop: false,
      atBottom: false,
    });

    onChange.mockClear();
    setMetrics(node, { scrollTop: 160 });
    node.dispatchEvent(new Event("scroll"));
    await nextFrame();
    expect(onChange).not.toHaveBeenCalled();

    action.destroy();
  });

  it("reports when the content outgrows the scroller without a scroll", () => {
    const onChange = vi.fn();
    const action = scrollEdges(node, { onChange });
    resize.flush();
    onChange.mockClear();

    setMetrics(node, { scrollHeight: 100 });
    resize.resize(node.children[0]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ isYScrollable: false });

    action.destroy();
  });

  it("observes children added later and releases removed ones", async () => {
    const action = scrollEdges(node, { onChange: vi.fn() });
    const added = document.createElement("p");
    const removed = node.children[0];
    node.append(added);
    removed.remove();
    await new Promise((resolve) => setTimeout(resolve));

    expect(resize.observed.has(added)).toBe(true);
    expect(resize.observed.has(removed)).toBe(false);

    action.destroy();
  });

  it("stops and restarts with `enabled`", async () => {
    const onChange = vi.fn();
    const action = scrollEdges(node, { onChange });
    resize.flush();
    expect(onChange).toHaveBeenCalledTimes(1);
    onChange.mockClear();

    action.update({ onChange, enabled: false });
    expect(resize.observed.size).toBe(0);
    setMetrics(node, { scrollTop: 100 });
    node.dispatchEvent(new Event("scroll"));
    await nextFrame();
    expect(onChange).not.toHaveBeenCalled();

    action.update({ onChange, enabled: true });
    resize.flush();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ atTop: false });

    action.destroy();
  });

  it("does not measure again when the params object is rebuilt unchanged", () => {
    const onChange = vi.fn();
    const action = scrollEdges(node, { onChange });
    resize.flush();
    const read = vi.fn(() => 300);
    Object.defineProperty(node, "scrollHeight", { get: read });

    action.update({ onChange, tolerance: 1, enabled: true });
    action.update({ onChange: vi.fn(), tolerance: 1 });
    expect(read).not.toHaveBeenCalled();

    action.destroy();
  });

  it("re-measures when the tolerance changes, and calls the latest onChange", () => {
    const first = vi.fn();
    const action = scrollEdges(node, { onChange: first });
    resize.flush();
    setMetrics(node, { scrollTop: 198 });

    const second = vi.fn();
    action.update({ onChange: second, tolerance: 2 });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second.mock.calls[0][0]).toMatchObject({ atBottom: true });

    action.destroy();
  });

  it("removes its listener and unsubscribes on destroy", async () => {
    const onChange = vi.fn();
    const action = scrollEdges(node, { onChange });
    resize.flush();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(resize.observed.size).toBeGreaterThan(0);
    onChange.mockClear();

    action.destroy();
    expect(resize.observed.size).toBe(0);
    setMetrics(node, { scrollTop: 100 });
    node.dispatchEvent(new Event("scroll"));
    await nextFrame();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reports the inline edges in RTL", () => {
    setMetrics(node, { scrollWidth: 300, clientWidth: 100, scrollLeft: -200 });
    const states: ScrollEdgeState[] = [];
    const action = scrollEdges(node, { onChange: (s) => states.push(s) });
    resize.flush();

    expect(states[0]).toMatchObject({
      isXScrollable: true,
      atStart: false,
      atEnd: true,
    });

    action.destroy();
  });
});
