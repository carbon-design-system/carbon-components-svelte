import {
  createHeightMeasurer,
  VIRTUAL_INDEX_ATTRIBUTE,
} from "../../src/utils/heightMeasurer.js";

/** A rendered window: one element per item index, inside a scroll container. */
function buildWindow(indices: number[]) {
  const container = document.createElement("div");
  for (const index of indices) {
    const element = document.createElement("div");
    element.setAttribute(VIRTUAL_INDEX_ATTRIBUTE, String(index));
    container.appendChild(element);
  }
  document.body.appendChild(container);
  return container;
}

function optionAt(container: Element, index: number) {
  const element = container.querySelector(
    `[${VIRTUAL_INDEX_ATTRIBUTE}="${index}"]`,
  );
  if (!(element instanceof HTMLElement)) {
    throw new Error(`no element for index ${index}`);
  }
  return element;
}

/** The measurer holds a batch until the next frame; this is that frame. */
function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * Replace the global `ResizeObserver` with one whose batches this test
 * delivers by hand, so heights can differ per element and arrive on demand.
 *
 * `deliver` resolves on the frame after the batch, when the measurer reports
 * it. `deliverWithoutFrame` stops short of that frame, for a test looking at
 * the state in between.
 */
function installResizeObserver() {
  const instances: FakeResizeObserver[] = [];

  class FakeResizeObserver {
    callback: ResizeObserverCallback;
    observed = new Set<Element>();

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
      instances.push(this);
    }

    observe(element: Element) {
      this.observed.add(element);
    }

    unobserve(element: Element) {
      this.observed.delete(element);
    }

    disconnect() {
      this.observed.clear();
    }
  }

  vi.stubGlobal("ResizeObserver", FakeResizeObserver);

  function current() {
    const instance = instances.at(-1);
    if (!instance) throw new Error("no ResizeObserver was constructed");
    return instance;
  }

  return {
    get observed() {
      return instances.length === 0 ? new Set<Element>() : current().observed;
    },
    get instanceCount() {
      return instances.length;
    },
    deliverWithoutFrame(
      measurements: Array<{ target: Element; height: number }>,
    ) {
      const instance = current();
      instance.callback(
        measurements.map(({ target, height }) => ({
          target,
          contentRect: { height } as DOMRectReadOnly,
          borderBoxSize: [{ blockSize: height, inlineSize: 0 }],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        })) as unknown as ResizeObserverEntry[],
        instance as unknown as ResizeObserver,
      );
    },
    deliver(measurements: Array<{ target: Element; height: number }>) {
      this.deliverWithoutFrame(measurements);
      return nextFrame();
    },
  };
}

describe("createHeightMeasurer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  test("reports each measured height against the item it renders", async () => {
    const resize = installResizeObserver();
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([10, 11, 12]);

    measurer.sync(container);
    expect(onMeasure).not.toHaveBeenCalled();

    await resize.deliver([
      { target: optionAt(container, 10), height: 40 },
      { target: optionAt(container, 11), height: 96 },
      { target: optionAt(container, 12), height: 64 },
    ]);

    expect(onMeasure).toHaveBeenCalledTimes(1);
    const [heights, previousHeights] = onMeasure.mock.calls[0];
    expect(heights[10]).toBe(40);
    expect(heights[11]).toBe(96);
    expect(heights[12]).toBe(64);
    expect(heights[9]).toBeUndefined();
    expect(previousHeights).toHaveLength(0);
  });

  test("reports nothing from inside the observer's own callback", async () => {
    const resize = installResizeObserver();
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([0]);

    measurer.sync(container);
    // Acting on a height moves the window, and doing that during a delivery
    // leaves the browser with observations it cannot deliver in that pass,
    // reported as an uncatchable window error on every scroll of a measured
    // menu. So nothing is reported until the callback has returned.
    resize.deliverWithoutFrame([
      { target: optionAt(container, 0), height: 40 },
    ]);
    expect(onMeasure).not.toHaveBeenCalled();

    await nextFrame();

    expect(onMeasure).toHaveBeenCalledTimes(1);
    expect(onMeasure.mock.calls[0][0][0]).toBe(40);
  });

  test("reports the batches of one frame as a single measurement", async () => {
    const resize = installResizeObserver();
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([0, 1]);

    measurer.sync(container);
    // One scroll delivers its options in several batches. Accumulating the
    // offsets once for all of them beats once per batch.
    resize.deliverWithoutFrame([
      { target: optionAt(container, 0), height: 40 },
    ]);
    resize.deliverWithoutFrame([
      { target: optionAt(container, 1), height: 96 },
    ]);
    resize.deliverWithoutFrame([
      { target: optionAt(container, 1), height: 88 },
    ]);

    await nextFrame();

    expect(onMeasure).toHaveBeenCalledTimes(1);
    const [heights] = onMeasure.mock.calls[0];
    expect(heights[0]).toBe(40);
    // The later report of an option supersedes the earlier one.
    expect(heights[1]).toBe(88);
  });

  test("drops a batch the frame has not reported when heights are forgotten", async () => {
    const resize = installResizeObserver();
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([0]);

    measurer.sync(container);
    resize.deliverWithoutFrame([
      { target: optionAt(container, 0), height: 40 },
    ]);
    // A filter keystroke between the batch and its frame: heights are held by
    // position, so this one now describes whichever option took position 0.
    measurer.clear();

    await nextFrame();

    expect(onMeasure).not.toHaveBeenCalled();
  });

  test("treats a height of zero as measured", async () => {
    const resize = installResizeObserver();
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([0]);

    measurer.sync(container);
    await resize.deliver([{ target: optionAt(container, 0), height: 0 }]);

    expect(onMeasure).toHaveBeenCalledTimes(1);
    expect(onMeasure.mock.calls[0][0][0]).toBe(0);
  });

  test("reports nothing when the delivered heights are unchanged", async () => {
    const resize = installResizeObserver();
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([0, 1]);

    measurer.sync(container);
    await resize.deliver([
      { target: optionAt(container, 0), height: 40 },
      { target: optionAt(container, 1), height: 40 },
    ]);
    expect(onMeasure).toHaveBeenCalledTimes(1);

    await resize.deliver([
      { target: optionAt(container, 0), height: 40 },
      { target: optionAt(container, 1), height: 40 },
    ]);
    expect(onMeasure).toHaveBeenCalledTimes(1);
  });

  test("keeps heights measured earlier when a later batch changes one", async () => {
    const resize = installResizeObserver();
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([0, 1]);

    measurer.sync(container);
    await resize.deliver([
      { target: optionAt(container, 0), height: 40 },
      { target: optionAt(container, 1), height: 80 },
    ]);
    await resize.deliver([{ target: optionAt(container, 1), height: 120 }]);

    expect(onMeasure).toHaveBeenCalledTimes(2);
    const [heights, previousHeights] = onMeasure.mock.calls[1];
    expect(heights[0]).toBe(40);
    expect(heights[1]).toBe(120);
    expect(previousHeights[1]).toBe(80);
  });

  test("ignores a height reported for an element that has left the DOM", async () => {
    const resize = installResizeObserver();
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([0, 1]);

    measurer.sync(container);
    await resize.deliver([
      { target: optionAt(container, 0), height: 40 },
      { target: optionAt(container, 1), height: 40 },
    ]);
    expect(onMeasure).toHaveBeenCalledTimes(1);

    // Scrolling an element out of the window is reported as a resize to
    // nothing on its way out. That is news of the removal, not a height.
    const leaving = optionAt(container, 1);
    leaving.remove();
    await resize.deliver([{ target: leaving, height: 0 }]);

    expect(onMeasure).toHaveBeenCalledTimes(1);
  });

  test("ignores a height reported after the element stopped being observed", async () => {
    const resize = installResizeObserver();
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([0]);
    const option = optionAt(container, 0);

    measurer.sync(container);
    measurer.sync(null);
    await resize.deliver([{ target: option, height: 40 }]);

    expect(onMeasure).not.toHaveBeenCalled();
  });

  test("ignores elements carrying no usable index", async () => {
    const resize = installResizeObserver();
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([0]);

    const blank = document.createElement("div");
    blank.setAttribute(VIRTUAL_INDEX_ATTRIBUTE, "");
    const fractional = document.createElement("div");
    fractional.setAttribute(VIRTUAL_INDEX_ATTRIBUTE, "1.5");
    const negative = document.createElement("div");
    negative.setAttribute(VIRTUAL_INDEX_ATTRIBUTE, "-1");
    container.append(blank, fractional, negative);

    measurer.sync(container);
    await resize.deliver([
      { target: blank, height: 40 },
      { target: fractional, height: 40 },
      { target: negative, height: 40 },
    ]);

    expect(onMeasure).not.toHaveBeenCalled();
  });

  test("observes only the options currently in the rendered window", () => {
    const resize = installResizeObserver();
    const measurer = createHeightMeasurer({ onMeasure: vi.fn() });
    const container = buildWindow([0, 1, 2]);

    measurer.sync(container);
    expect(resize.observed.size).toBe(3);
    const stillRendered = optionAt(container, 2);

    optionAt(container, 0).remove();
    optionAt(container, 1).remove();
    const element = document.createElement("div");
    element.setAttribute(VIRTUAL_INDEX_ATTRIBUTE, "3");
    container.appendChild(element);

    measurer.sync(container);

    expect(resize.observed.size).toBe(2);
    expect(resize.observed.has(stillRendered)).toBe(true);
    expect(resize.observed.has(element)).toBe(true);
    // The observer is shared across the window, not one per option.
    expect(resize.instanceCount).toBe(1);
  });

  test("stops observing when the window goes away", () => {
    const resize = installResizeObserver();
    const measurer = createHeightMeasurer({ onMeasure: vi.fn() });
    const container = buildWindow([0, 1]);

    measurer.sync(container);
    expect(resize.observed.size).toBe(2);

    measurer.sync(null);

    expect(resize.observed.size).toBe(0);
  });

  test("clear reports an empty set of heights exactly once", async () => {
    const resize = installResizeObserver();
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([0]);

    measurer.sync(container);
    await resize.deliver([{ target: optionAt(container, 0), height: 40 }]);

    measurer.clear();
    expect(onMeasure).toHaveBeenCalledTimes(2);
    expect(onMeasure.mock.calls[1][0]).toHaveLength(0);
    expect(onMeasure.mock.calls[1][1][0]).toBe(40);

    measurer.clear();
    expect(onMeasure).toHaveBeenCalledTimes(2);
  });

  test("stops observing when cleared, so the next sync measures again", () => {
    const resize = installResizeObserver();
    const measurer = createHeightMeasurer({ onMeasure: vi.fn() });
    const container = buildWindow([0, 1]);

    measurer.sync(container);
    expect(resize.observed.size).toBe(2);

    // A filter narrowing a list forgets every height, but the options that
    // survived it keep their elements. Nothing resizes, so observing them
    // afresh is the only thing that reports their heights again.
    measurer.clear();
    expect(resize.observed.size).toBe(0);

    measurer.sync(container);

    expect(resize.observed.size).toBe(2);
    // Still one observer covering the window, not one per option.
    expect(resize.instanceCount).toBe(1);
  });

  test("disconnect stops further reports", async () => {
    const resize = installResizeObserver();
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([0]);

    measurer.sync(container);
    measurer.disconnect();
    await resize.deliver([{ target: optionAt(container, 0), height: 40 }]);

    expect(onMeasure).not.toHaveBeenCalled();
  });

  test("falls back to a one-shot height read with no ResizeObserver", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const onMeasure = vi.fn();
    const measurer = createHeightMeasurer({ onMeasure });
    const container = buildWindow([0, 1]);
    optionAt(container, 0).getBoundingClientRect = () =>
      ({ height: 40 }) as DOMRect;
    optionAt(container, 1).getBoundingClientRect = () =>
      ({ height: 88 }) as DOMRect;

    measurer.sync(container);

    expect(onMeasure).toHaveBeenCalledTimes(1);
    const [heights] = onMeasure.mock.calls[0];
    expect(heights[0]).toBe(40);
    expect(heights[1]).toBe(88);
  });
});
