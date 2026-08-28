import { tick } from "svelte";
import { createMenuWindow } from "../../src/ListBox/menuWindow.js";
import { VIRTUAL_INDEX_ATTRIBUTE } from "../../src/utils/heightMeasurer.js";

type Item = { id: number; text: string };

const CONTAINER_HEIGHT = 300;
const ITEM_HEIGHT = 40;
/** The height every option reports once it is measured. */
const MEASURED_HEIGHT = 100;

function buildItems(count: number, prefix = "Item"): Item[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    text: `${prefix} ${index}`,
  }));
}

/**
 * A menu whose geometry this test owns outright, since jsdom computes none:
 * the container clamps a written scroll position to a scrollable range the
 * test states, and every rendered option reports the height it was stamped
 * with.
 */
function buildContainer(scrollHeight = 100_000) {
  const container = document.createElement("div");
  let scrollTop = 0;
  const maxScroll = Math.max(0, scrollHeight - CONTAINER_HEIGHT);

  Object.defineProperty(container, "scrollTop", {
    get: () => scrollTop,
    set: (next: number) => {
      scrollTop = Math.max(0, Math.min(next, maxScroll));
    },
    configurable: true,
  });
  Object.defineProperty(container, "clientHeight", {
    value: CONTAINER_HEIGHT,
    configurable: true,
  });
  container.getBoundingClientRect = () =>
    ({ top: 0, bottom: CONTAINER_HEIGHT }) as DOMRect;

  document.body.appendChild(container);
  return { container, maxScroll };
}

/** Render the options the window asked for, each carrying its height. */
function renderOptions(
  container: HTMLElement,
  state: { itemsToRender: Item[]; startIndex: number; isMeasured: boolean },
  heightAt: (index: number) => number = () => MEASURED_HEIGHT,
) {
  container.innerHTML = "";
  state.itemsToRender.forEach((item, index) => {
    const option = document.createElement("div");
    const itemIndex = state.startIndex + index;
    if (state.isMeasured) {
      option.setAttribute(VIRTUAL_INDEX_ATTRIBUTE, String(itemIndex));
    }
    option.textContent = item.text;
    const height = heightAt(itemIndex);
    option.getBoundingClientRect = () =>
      ({ top: 0, bottom: height, height }) as DOMRect;
    container.appendChild(option);
  });
}

/** The measurer holds a batch until the next frame; this is that frame. */
function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * Stub `ResizeObserver` so its batches are delivered by hand. jsdom lays
 * nothing out, so a real one would never fire, and a test wants to arrive
 * between an interaction and the measurement it triggers: the state in between
 * is what it is looking at.
 */
function installManualResizeObserver() {
  const instances: ManualResizeObserver[] = [];

  class ManualResizeObserver {
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

  vi.stubGlobal("ResizeObserver", ManualResizeObserver);

  return {
    /**
     * Report every observed option at the height `renderOptions` gave it, and
     * resolve on the frame the measurer reports it: a batch is deliberately
     * not acted on from inside the observer's own callback.
     */
    deliverAll() {
      const instance = instances.at(-1);
      if (!instance) throw new Error("no ResizeObserver was constructed");
      const entries = Array.from(instance.observed, (target) => {
        const { height } = target.getBoundingClientRect();
        return {
          target,
          contentRect: { height } as DOMRectReadOnly,
          borderBoxSize: [{ blockSize: height, inlineSize: 0 }],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        };
      }) as unknown as ResizeObserverEntry[];
      instance.callback(entries, instance as unknown as ResizeObserver);
      return nextFrame();
    },
  };
}

function setup({ scrollHeight }: { scrollHeight?: number } = {}) {
  const { container, maxScroll } = buildContainer(scrollHeight);
  const scrollTops: number[] = [];
  let changeCount = 0;
  let lastState: ReturnType<(typeof menu)["update"]> | null = null;

  const menu = createMenuWindow<Item>({
    getContainer: () => container,
    onScrollTop: (scrollTop) => scrollTops.push(scrollTop),
    onState: (state) => {
      changeCount += 1;
      lastState = state;
    },
  });

  return {
    container,
    maxScroll,
    menu,
    scrollTops,
    get changeCount() {
      return changeCount;
    },
    get lastState() {
      return lastState;
    },
  };
}

/**
 * One very tall option among short ones, so that where an option sits
 * depends on *which* options are above it and not merely on how tall they
 * run on average. Total scroll height cannot tell the two apart, since
 * forgetting every height and laying the list out at their average comes to the
 * same sum, but a placement can.
 */
const TALL_HEIGHT = 300;
const SHORT_HEIGHT = 20;
const unevenHeight = (index: number) =>
  index === 0 ? TALL_HEIGHT : SHORT_HEIGHT;

/** Where option 5 sits once the heights above it are known. */
const PLACED_ON_MEASURED = TALL_HEIGHT + 4 * SHORT_HEIGHT;
/** ...and where it sits when only their average survives. */
const PLACED_ON_ESTIMATE = 5 * ((TALL_HEIGHT + 10 * SHORT_HEIGHT) / 11);

function update(
  harness: ReturnType<typeof setup>,
  items: Item[],
  getKey?: (item: Item) => unknown,
) {
  return harness.menu.update({
    items,
    getKey,
    shouldVirtualize: true,
    virtualize: true,
    wrapOptions: true,
    scrollTop: harness.container.scrollTop,
  });
}

/** Render and measure the window, then hand back the settled state. */
async function measure(
  harness: ReturnType<typeof setup>,
  observer: ReturnType<typeof installManualResizeObserver>,
  items: Item[],
  getKey?: (item: Item) => unknown,
) {
  const state = update(harness, items, getKey);
  renderOptions(harness.container, state, unevenHeight);
  await harness.menu.sync();
  await observer.deliverAll();
  return update(harness, items, getKey);
}

/** Place option 5 at the top of the menu and report where it landed. */
function placeFifthOption(harness: ReturnType<typeof setup>) {
  harness.menu.scrollIntoView(5, "top");
  return harness.container.scrollTop;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("createMenuWindow: the visible slice", () => {
  test("renders every option, unwindowed, below the threshold", () => {
    const { menu } = setup();
    const items = buildItems(99);

    const state = menu.update({
      items,
      shouldVirtualize: true,
      virtualize: true,
      scrollTop: 0,
    });

    expect(state.isVirtualized).toBe(false);
    expect(state.itemsToRender).toHaveLength(99);
    expect(state.startIndex).toBe(0);
    expect(state.offsetY).toBe(0);
    expect(state.totalHeight).toBe(99 * ITEM_HEIGHT);
  });

  test("renders only the visible slice above the threshold", () => {
    const { menu } = setup();
    const items = buildItems(300);

    const state = menu.update({
      items,
      shouldVirtualize: true,
      virtualize: true,
      scrollTop: 0,
    });

    expect(state.isVirtualized).toBe(true);
    expect(state.startIndex).toBe(0);
    expect(state.offsetY).toBe(0);
    expect(state.totalHeight).toBe(300 * ITEM_HEIGHT);
    expect(state.itemsToRender[0]).toBe(items[0]);
    // A 300px viewport of 40px options, plus three of overscan.
    expect(state.itemsToRender).toHaveLength(
      Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + 3,
    );
  });

  test("offsets the slice by the options scrolled past", () => {
    const { menu } = setup();

    const state = menu.update({
      items: buildItems(300),
      shouldVirtualize: true,
      virtualize: true,
      scrollTop: 400,
    });

    expect(state.startIndex).toBe(400 / ITEM_HEIGHT - 3);
    expect(state.offsetY).toBe(state.startIndex * ITEM_HEIGHT);
  });

  test("sizes options by the menu size and fluidity", () => {
    const { menu } = setup();
    const items = buildItems(300);

    const small = menu.update({
      items,
      shouldVirtualize: true,
      virtualize: true,
      size: "sm",
      scrollTop: 0,
    });
    expect(small.totalHeight).toBe(300 * 32);

    const fluid = menu.update({
      items,
      shouldVirtualize: true,
      virtualize: true,
      size: "sm",
      fluid: true,
      scrollTop: 0,
    });
    expect(fluid.totalHeight).toBe(300 * 64);
  });
});

describe("createMenuWindow: the menu's maximum height", () => {
  test("takes the size-based maximum when the list is not windowed", () => {
    const { menu } = setup();

    const state = menu.update({
      items: buildItems(10),
      shouldVirtualize: false,
      virtualize: undefined,
      size: "sm",
      scrollTop: 0,
    });

    expect(state.menuMaxHeight).toBe("11rem");
  });

  test("takes the windowed viewport once windowing is configured", () => {
    const { menu } = setup();

    const state = menu.update({
      items: buildItems(300),
      shouldVirtualize: true,
      virtualize: { containerHeight: 240 },
      size: "sm",
      scrollTop: 0,
    });

    expect(state.menuMaxHeight).toBe("240px");
  });

  test("reports a resolved configuration on a list too short to be windowed", () => {
    const { menu } = setup();

    const state = menu.update({
      items: buildItems(10),
      shouldVirtualize: true,
      virtualize: { containerHeight: 240 },
      size: "sm",
      scrollTop: 0,
    });

    // The list renders whole, but its menu is still scrolled within the
    // configured viewport, so the maximum height is the windowed one and the
    // caller needs to tell that apart from `isVirtualized`.
    expect(state.isVirtualized).toBe(false);
    expect(state.isWindowed).toBe(true);
    expect(state.menuMaxHeight).toBe("240px");
  });

  test("wrapping on its own resolves no windowing configuration", () => {
    const { menu } = setup();

    const state = menu.update({
      items: buildItems(10),
      shouldVirtualize: false,
      virtualize: undefined,
      wrapOptions: true,
      size: "sm",
      scrollTop: 0,
    });

    // Wrapping asks for measured heights, not for a window. A prop that
    // synthesized a configuration here would swap the size-based maximum for
    // the windowed viewport, making a short menu taller for turning on an
    // accessibility prop.
    expect(state.isWindowed).toBe(false);
    expect(state.isVirtualized).toBe(false);
    expect(state.menuMaxHeight).toBe("11rem");
  });

  test("reports no configuration when the list is not windowed at all", () => {
    const { menu } = setup();

    const state = menu.update({
      items: buildItems(10),
      shouldVirtualize: false,
      virtualize: undefined,
      size: "sm",
      scrollTop: 0,
    });

    expect(state.isWindowed).toBe(false);
  });
});

describe("createMenuWindow: measured heights", () => {
  test("re-enters the heights it measured without the caller carrying them", async () => {
    const observer = installManualResizeObserver();
    const { container, menu } = setup();
    const items = buildItems(300);

    const update = () =>
      menu.update({
        items,
        shouldVirtualize: true,
        virtualize: true,
        wrapOptions: true,
        scrollTop: 0,
      });

    let state = update();
    expect(state.isMeasured).toBe(true);
    // Nothing measured yet, so every option is laid out at the seed.
    expect(state.totalHeight).toBe(300 * ITEM_HEIGHT);

    renderOptions(container, state);
    await menu.sync();
    await observer.deliverAll();

    state = update();
    // The measured options carry their real height; the rest take the average
    // of what has been measured, which is that same height.
    expect(state.totalHeight).toBe(300 * MEASURED_HEIGHT);
  });

  test("tells the caller when measurement moves what an update would return", async () => {
    const observer = installManualResizeObserver();
    const harness = setup();
    const items = buildItems(300);

    const state = harness.menu.update({
      items,
      shouldVirtualize: true,
      virtualize: true,
      wrapOptions: true,
      scrollTop: 0,
    });
    renderOptions(harness.container, state);
    await harness.menu.sync();

    const before = harness.changeCount;
    await observer.deliverAll();

    expect(harness.changeCount).toBeGreaterThan(before);
    // What arrives is the resolved state itself, laid out against the heights
    // just measured rather than the seed the first pass used.
    expect(harness.lastState?.totalHeight).toBe(300 * MEASURED_HEIGHT);
    expect(state.totalHeight).toBe(300 * ITEM_HEIGHT);
  });

  test("leaves offsets on the seed while the list is under the threshold", async () => {
    const observer = installManualResizeObserver();
    const { container, menu } = setup();
    const items = buildItems(50);

    const state = menu.update({
      items,
      shouldVirtualize: true,
      virtualize: true,
      wrapOptions: true,
      scrollTop: 0,
    });
    expect(state.isVirtualized).toBe(false);

    renderOptions(container, state);
    await menu.sync();

    // Nothing is observed at all: below the threshold the browser lays every
    // option out itself, so there is no offset for a height to sharpen.
    expect(() => observer.deliverAll()).toThrow();

    const next = menu.update({
      items,
      shouldVirtualize: true,
      virtualize: true,
      wrapOptions: true,
      scrollTop: 0,
    });
    expect(next.totalHeight).toBe(50 * ITEM_HEIGHT);
  });

  test("renders the list whole when nothing can be measured", async () => {
    // No `ResizeObserver` at all, and a layout engine that lays nothing out:
    // the one-shot fallback read measures every option at zero. Nothing can be
    // windowed against heights like those, and the list still renders.
    vi.stubGlobal("ResizeObserver", undefined);
    const { container, menu } = setup();
    const items = buildItems(300);

    const update = () =>
      menu.update({
        items,
        shouldVirtualize: true,
        virtualize: true,
        wrapOptions: true,
        scrollTop: 0,
      });

    renderOptions(container, update(), () => 0);
    await menu.sync();

    expect(update().itemsToRender).toHaveLength(300);
  });
});

describe("createMenuWindow: wrapping is the only thing that measures", () => {
  const base = {
    shouldVirtualize: true,
    scrollTop: 0,
  } as const;

  test("measures nothing when wrapping is off", () => {
    const { menu } = setup();

    const state = menu.update({
      ...base,
      items: buildItems(300),
      virtualize: true,
    });

    expect(state.isMeasured).toBe(false);
  });

  test("measures when wrapping is on", () => {
    const { menu } = setup();

    const state = menu.update({
      ...base,
      items: buildItems(300),
      virtualize: true,
      wrapOptions: true,
    });

    expect(state.isMeasured).toBe(true);
  });

  // Measuring is not a consumer-facing choice, so `measured` is not part of
  // the `virtualize` shape the components document. A key that reached the
  // config anyway would be able to contradict the prop that is, in both
  // directions; neither of these two does anything.
  test("ignores a measured key asking for it without wrapping", () => {
    const { menu } = setup();

    const state = menu.update({
      ...base,
      items: buildItems(300),
      virtualize: { measured: true },
    });

    expect(state.isMeasured).toBe(false);
  });

  test("ignores a measured key contradicting wrapping", () => {
    const { menu } = setup();

    const state = menu.update({
      ...base,
      items: buildItems(300),
      virtualize: { measured: false },
      wrapOptions: true,
    });

    expect(state.isMeasured).toBe(true);
  });

  test("a consumer who opted into neither pays for neither", () => {
    const observer = installManualResizeObserver();
    const getKey = vi.fn((item: Item) => item.id);
    const { container, menu } = setup();

    const state = menu.update({
      ...base,
      items: buildItems(300),
      virtualize: true,
      getKey,
    });
    renderOptions(container, state);

    // No deferral: the reconciliation is over by the time `sync` returns.
    expect(menu.sync()).toBeUndefined();
    expect(getKey).not.toHaveBeenCalled();
    expect(() => observer.deliverAll()).toThrow();
  });
});

describe("createMenuWindow: bringing an option into view", () => {
  test("puts a top-aligned option at the top of a fixed-height menu", () => {
    const { container, menu, scrollTops } = setup();

    menu.update({
      items: buildItems(300),
      shouldVirtualize: true,
      virtualize: true,
      scrollTop: 0,
    });
    menu.scrollIntoView(50, "top");

    expect(container.scrollTop).toBe(50 * ITEM_HEIGHT);
    expect(scrollTops).toEqual([50 * ITEM_HEIGHT]);
  });

  test("reports the position the container took, not the one asked for", () => {
    const { container, menu, scrollTops, maxScroll } = setup({
      scrollHeight: 1000,
    });

    menu.update({
      items: buildItems(300),
      shouldVirtualize: true,
      virtualize: true,
      wrapOptions: true,
      scrollTop: 0,
    });
    menu.scrollIntoView(299, "top");

    // Reporting the request instead would leave the caller's mirror, the value
    // its windowing math reads, describing a position nothing is at.
    expect(container.scrollTop).toBe(maxScroll);
    expect(scrollTops).toEqual([maxScroll]);
  });

  test("bounds a top-aligned request by the end of the list", () => {
    const { container, menu } = setup();

    menu.update({
      items: buildItems(300),
      shouldVirtualize: true,
      virtualize: true,
      wrapOptions: true,
      scrollTop: 0,
    });
    menu.scrollIntoView(299, "top");

    // Putting the last option at the top of the viewport would scroll past the
    // end of the list, so the request is bounded by it before the container has
    // to clamp anything.
    expect(container.scrollTop).toBe(300 * ITEM_HEIGHT - CONTAINER_HEIGHT);
  });

  test("sends a measured menu to the top when there is nothing to show", () => {
    const { container, menu } = setup();

    menu.update({
      items: buildItems(300),
      shouldVirtualize: true,
      virtualize: true,
      wrapOptions: true,
      scrollTop: 0,
    });
    container.scrollTop = 1200;
    menu.scrollIntoView(-1, "top");

    expect(container.scrollTop).toBe(0);
  });

  test("sends a fixed-height menu to the top when there is nothing to show", () => {
    const { container, menu } = setup();

    menu.update({
      items: buildItems(300),
      shouldVirtualize: true,
      virtualize: true,
      scrollTop: 0,
    });
    container.scrollTop = 1200;
    menu.scrollIntoView(-1, "top");

    expect(container.scrollTop).toBe(0);
  });

  test("leaves a nearest option already on screen alone", () => {
    const { container, menu, scrollTops } = setup();

    menu.update({
      items: buildItems(300),
      shouldVirtualize: true,
      virtualize: true,
      scrollTop: 0,
    });
    menu.scrollIntoView(2, "nearest");

    expect(container.scrollTop).toBe(0);
    expect(scrollTops).toEqual([]);
  });

  test("brings a nearest option off the window into a fixed-height menu", () => {
    const { container, menu } = setup();

    menu.update({
      items: buildItems(300),
      shouldVirtualize: true,
      virtualize: true,
      scrollTop: 0,
    });
    menu.scrollIntoView(80, "nearest");

    expect(container.scrollTop).toBe(80 * ITEM_HEIGHT);
  });

  test("places a top-aligned option against the heights measured so far", async () => {
    const observer = installManualResizeObserver();
    const { container, menu } = setup();
    const items = buildItems(300);

    const update = (scrollTop: number) =>
      menu.update({
        items,
        shouldVirtualize: true,
        virtualize: true,
        wrapOptions: true,
        scrollTop,
      });

    let state = update(0);
    renderOptions(container, state);
    await menu.sync();
    await observer.deliverAll();

    state = update(container.scrollTop);
    menu.scrollIntoView(50, "top");

    // The options above it are all measured at MEASURED_HEIGHT by now, so the
    // placement rests on those and not on the seed.
    expect(container.scrollTop).toBe(50 * MEASURED_HEIGHT);
  });

  test("re-places a measured request as the heights sharpen", async () => {
    const observer = installManualResizeObserver();
    const { container, menu } = setup();
    const items = buildItems(300);

    const update = (scrollTop: number) =>
      menu.update({
        items,
        shouldVirtualize: true,
        virtualize: true,
        wrapOptions: true,
        scrollTop,
      });

    let state = update(0);
    renderOptions(container, state);

    // Asked for before anything has been measured: the only placement
    // available rests on the seed.
    menu.scrollIntoView(50, "top");
    expect(container.scrollTop).toBe(50 * ITEM_HEIGHT);

    state = update(container.scrollTop);
    renderOptions(container, state);
    await menu.sync();
    await observer.deliverAll();

    state = update(container.scrollTop);
    renderOptions(container, state);
    await menu.sync();

    // The request stood, so the option is placed again against what the
    // options that rendered turned out to measure.
    expect(container.scrollTop).toBe(50 * MEASURED_HEIGHT);
  });

  test("brings a nearest option into a measured menu, and only then", async () => {
    const observer = installManualResizeObserver();
    const harness = setup();
    const items = buildItems(300);

    await measure(harness, observer, items);

    // Option 1 is inside the window the measured offsets put on screen, so a
    // nearest request has nothing to do: the reader is already looking at it.
    harness.menu.scrollIntoView(1, "nearest");
    expect(harness.container.scrollTop).toBe(0);

    // Option 50 is far below it, so this one has to move, and it lands on the
    // offset the measured heights give it rather than the one the seed would.
    harness.menu.scrollIntoView(50, "nearest");

    const measuredRun = TALL_HEIGHT + 10 * SHORT_HEIGHT;
    const unmeasured = 39 * (measuredRun / 11);
    expect(harness.container.scrollTop).toBeCloseTo(
      measuredRun + unmeasured,
      6,
    );
    expect(harness.container.scrollTop).not.toBe(50 * ITEM_HEIGHT);
  });

  test("a reader's own scroll supersedes an outstanding request", async () => {
    const observer = installManualResizeObserver();
    const { container, menu } = setup();
    const items = buildItems(300);

    const update = (scrollTop: number) =>
      menu.update({
        items,
        shouldVirtualize: true,
        virtualize: true,
        wrapOptions: true,
        scrollTop,
      });

    let state = update(0);
    renderOptions(container, state);
    menu.scrollIntoView(50, "top");

    container.scrollTop = 900;
    menu.noteScroll(900);

    state = update(900);
    renderOptions(container, state);
    await menu.sync();
    await observer.deliverAll();
    state = update(container.scrollTop);
    renderOptions(container, state);
    await menu.sync();

    // Nothing pulled the reader back to the option they had been sent to.
    expect(container.scrollTop).not.toBe(50 * MEASURED_HEIGHT);
  });

  test("does nothing at all while the menu is not windowed", () => {
    const { container, menu, scrollTops } = setup();

    menu.update({
      items: buildItems(300),
      shouldVirtualize: false,
      virtualize: undefined,
      scrollTop: 0,
    });
    menu.scrollIntoView(50, "top");

    expect(container.scrollTop).toBe(0);
    expect(scrollTops).toEqual([]);
  });
});

describe("createMenuWindow: the collection the heights describe", () => {
  test("keeps the measurements when a rebuild holds the same options", async () => {
    const observer = installManualResizeObserver();
    const harness = setup();
    const items = buildItems(300);

    await measure(harness, observer, items);
    // A filtering menu rebuilds its collection on every keystroke, and most of
    // those rebuilds arrive at the same options in the same order.
    update(harness, [...items]);

    expect(placeFifthOption(harness)).toBe(PLACED_ON_MEASURED);
  });

  test("forgets the measurements when the collection holds other options", async () => {
    const observer = installManualResizeObserver();
    const harness = setup();

    await measure(harness, observer, buildItems(300));
    const replaced = update(harness, buildItems(300, "Other"));

    // Every height described an option that is no longer there. What survives
    // is the one thing that was never about a particular option: how tall this
    // consumer's options run.
    expect(replaced.itemsToRender[0].text).toBe("Other 0");
    expect(placeFifthOption(harness)).toBeCloseTo(PLACED_ON_ESTIMATE, 6);
  });

  test("identifies options by the supplied key across a rebuild", async () => {
    const observer = installManualResizeObserver();
    const harness = setup();
    const getKey = (item: Item) => item.id;

    await measure(harness, observer, buildItems(300), getKey);
    // Every option object is replaced, as a checkbox toggle would replace the
    // toggled one; the ids are what stayed put, so the heights still describe
    // the options they were measured on.
    update(harness, buildItems(300), getKey);

    expect(placeFifthOption(harness)).toBe(PLACED_ON_MEASURED);
  });

  test("forgets when the keys themselves move", async () => {
    const observer = installManualResizeObserver();
    const harness = setup();
    const getKey = (item: Item) => item.id;
    const items = buildItems(300);

    await measure(harness, observer, items, getKey);
    const reordered = update(harness, [...items].reverse(), getKey);

    expect(reordered.itemsToRender[0].id).toBe(299);
    expect(placeFifthOption(harness)).toBeCloseTo(PLACED_ON_ESTIMATE, 6);
  });

  test("a rebuilt collection with no key is told apart by the options themselves", async () => {
    const observer = installManualResizeObserver();
    const harness = setup();

    await measure(harness, observer, buildItems(300));
    // No key function, and every option object is new: nothing says these are
    // the options the heights were measured on.
    update(harness, buildItems(300));

    expect(placeFifthOption(harness)).toBeCloseTo(PLACED_ON_ESTIMATE, 6);
  });
});

describe("createMenuWindow: closing and teardown", () => {
  test("forgets the measurements on close but keeps the estimate", async () => {
    const observer = installManualResizeObserver();
    const harness = setup();
    const items = buildItems(300);

    await measure(harness, observer, items);
    expect(placeFifthOption(harness)).toBe(PLACED_ON_MEASURED);

    harness.container.scrollTop = 0;
    harness.menu.reset();
    update(harness, items);

    // No option is measured any more, so every one of them takes the estimate,
    // which is what the last opening averaged to rather than the seed.
    expect(placeFifthOption(harness)).toBeCloseTo(PLACED_ON_ESTIMATE, 6);
  });

  test("withdrawing a request keeps the heights it was placed against", async () => {
    const observer = installManualResizeObserver();
    const harness = setup();
    const items = buildItems(300);

    await measure(harness, observer, items);
    harness.menu.cancelRequest();

    // Withdrawing is not closing. The reader is still reading this menu, so
    // the heights measured for it still describe what is on screen.
    expect(placeFifthOption(harness)).toBe(PLACED_ON_MEASURED);
  });

  test("has nothing to say about an unmeasured list on close", () => {
    const harness = setup();
    const items = buildItems(300);

    update(harness, items);
    const before = harness.changeCount;
    harness.menu.reset();

    // Not zero, and not the consumer's seed echoed back: no evidence at all,
    // which leaves the seed in charge and gives the caller nothing to hear.
    expect(harness.changeCount).toBe(before);
    expect(update(harness, items).totalHeight).toBe(300 * ITEM_HEIGHT);
  });

  test("a close that learns nothing new is not news for the caller", async () => {
    const observer = installManualResizeObserver();
    const harness = setup();
    const items = buildItems(300);

    await measure(harness, observer, items);
    harness.menu.reset();

    const before = harness.changeCount;
    harness.menu.reset();

    // Nothing has been measured since, so there is nothing new to say.
    expect(harness.changeCount).toBe(before);
  });

  test("stops observing once torn down", async () => {
    const observer = installManualResizeObserver();
    const harness = setup();
    const items = buildItems(300);

    const state = harness.menu.update({
      items,
      shouldVirtualize: true,
      virtualize: true,
      wrapOptions: true,
      scrollTop: 0,
    });
    renderOptions(harness.container, state);
    await harness.menu.sync();

    harness.menu.destroy();
    const before = harness.changeCount;
    await observer.deliverAll();
    await tick();

    expect(harness.changeCount).toBe(before);
    expect(
      harness.menu.update({
        items,
        shouldVirtualize: true,
        virtualize: true,
        wrapOptions: true,
        scrollTop: 0,
      }).totalHeight,
    ).toBe(300 * ITEM_HEIGHT);
  });
});

/**
 * Every case below arrived with `createMeasuredMenuScroll`, whose suite this
 * absorbed when the module was. They ask the same questions of the menu
 * window's own interface: the metrics that used to be handed across the seam
 * are now the ones the last `update` resolved, and the requests are the ones
 * `scrollIntoView` leaves outstanding.
 */
describe("createMenuWindow: the measured scroll position", () => {
  /**
   * A measured menu whose options sit where their own heights put them, so the
   * fixture can disagree with the windowing arithmetic about how tall an
   * option rendered. That disagreement is the subject: it is what the offsets
   * cannot see and the rects can.
   */
  function setupPlaced({
    optionHeights = {},
    defaultHeight = ITEM_HEIGHT,
    itemCount = 300,
  }: {
    /** Rendered height by item index; anything omitted is `defaultHeight`. */
    optionHeights?: Record<number, number>;
    defaultHeight?: number;
    itemCount?: number;
  } = {}) {
    const items = buildItems(itemCount);
    const heightOf = (index: number) => optionHeights[index] ?? defaultHeight;
    const topOf = (index: number) => {
      let top = 0;
      for (let i = 0; i < index; i++) top += heightOf(i);
      return top;
    };
    const scrollHeight = topOf(itemCount);
    const maxScroll = Math.max(0, scrollHeight - CONTAINER_HEIGHT);

    const container = document.createElement("div");
    // The menu's own scroll container, which is what bounds the one adjustment
    // only the DOM can work out.
    container.setAttribute("role", "listbox");
    Object.defineProperty(container, "clientHeight", {
      value: CONTAINER_HEIGHT,
      configurable: true,
    });
    Object.defineProperty(container, "scrollHeight", {
      value: scrollHeight,
      configurable: true,
    });
    let scrollTop = 0;
    Object.defineProperty(container, "scrollTop", {
      get: () => scrollTop,
      set: (next: number) => {
        scrollTop = Math.max(0, Math.min(next, maxScroll));
      },
      configurable: true,
    });
    container.getBoundingClientRect = () =>
      ({ top: 0, bottom: CONTAINER_HEIGHT }) as DOMRect;
    document.body.appendChild(container);

    const scrollTops: number[] = [];
    const menu = createMenuWindow<Item>({
      getContainer: () => container,
      onScrollTop: (next) => scrollTops.push(next),
    });

    /** Resolve the window at the menu's current position and render it. */
    function render(collection: Item[] = items) {
      const state = menu.update({
        items: collection,
        shouldVirtualize: true,
        virtualize: true,
        wrapOptions: true,
        scrollTop: container.scrollTop,
      });
      container.innerHTML = "";
      state.itemsToRender.forEach((item, index) => {
        const itemIndex = state.startIndex + index;
        const height = heightOf(itemIndex);
        const option = document.createElement("div");
        option.setAttribute(VIRTUAL_INDEX_ATTRIBUTE, String(itemIndex));
        option.textContent = item.text;
        option.getBoundingClientRect = () =>
          ({
            top: topOf(itemIndex) - container.scrollTop,
            bottom: topOf(itemIndex) - container.scrollTop + height,
            height,
          }) as DOMRect;
        const marker = document.createElement("span");
        marker.setAttribute("data-measured-height", String(height));
        option.appendChild(marker);
        container.appendChild(option);
      });
      return state;
    }

    return { container, menu, scrollTops, maxScroll, render };
  }

  test("finishes a settled request by asking the DOM about the option itself", async () => {
    // The option is mounted and the offsets agree with the arithmetic, but it
    // is eight times the assumed height and hangs past the viewport. Nothing
    // but its own rect can say so.
    installManualResizeObserver();
    const { container, menu, render } = setupPlaced({
      optionHeights: { 2: 320 },
    });
    render();

    menu.scrollIntoView(2, "nearest");
    // Already inside the rendered window, so the arithmetic leaves it alone.
    expect(container.scrollTop).toBe(0);

    await menu.sync();

    // Option 2 spans 80..400 of a 300-tall viewport, so 100 brings its bottom
    // flush with the bottom of the menu.
    expect(container.scrollTop).toBe(100);
  });

  test("a reader's move supersedes a request, reported or not", async () => {
    const observer = installManualResizeObserver();
    const { container, menu, render } = setupPlaced({
      optionHeights: { 2: 320 },
    });
    render();

    menu.scrollIntoView(2, "nearest");
    await menu.sync();
    expect(container.scrollTop).toBe(100);

    // A position the reader took that no scroll event has reported yet. A
    // scroll event and the measurer's own frame are not ordered against each
    // other, so waiting to be told leaves a batch free to arrive first and
    // place the option against a position the reader has already left.
    container.scrollTop = 4000;
    render();
    await menu.sync();
    await observer.deliverAll();

    expect(container.scrollTop).toBe(4000);
  });

  test("keeps a request through the scroll event its own write produced", async () => {
    installManualResizeObserver();
    const { container, menu, render } = setupPlaced({
      optionHeights: { 2: 320 },
    });
    render();

    menu.scrollIntoView(2, "nearest");
    menu.noteScroll(container.scrollTop);
    await menu.sync();

    expect(container.scrollTop).toBe(100);
  });

  test("a withdrawn request is not placed later", async () => {
    installManualResizeObserver();
    const { container, menu, render } = setupPlaced({
      optionHeights: { 2: 320 },
    });
    render();

    menu.scrollIntoView(2, "nearest");
    // The caller has learned the reader moved on, which nothing here can see:
    // a pointer landing on another option moves no scroll position.
    menu.cancelRequest();
    await menu.sync();

    expect(container.scrollTop).toBe(0);
  });

  test("a close drops the request so nothing re-places the option", async () => {
    installManualResizeObserver();
    const { container, menu, render } = setupPlaced({
      optionHeights: { 2: 320 },
    });
    render();

    menu.scrollIntoView(2, "nearest");
    menu.reset();
    await menu.sync();

    expect(container.scrollTop).toBe(0);
  });

  test("tearing down drops the request too", async () => {
    installManualResizeObserver();
    const { container, menu, render } = setupPlaced({
      optionHeights: { 2: 320 },
    });
    render();

    menu.scrollIntoView(2, "nearest");
    menu.destroy();
    await menu.sync();

    expect(container.scrollTop).toBe(0);
  });

  test("a changed collection drops the outstanding request", async () => {
    installManualResizeObserver();
    const { container, menu, render } = setupPlaced({
      optionHeights: { 2: 320 },
    });
    render();

    menu.scrollIntoView(2, "nearest");
    // Index 2 named a different option before the collection changed, so the
    // request cannot be carried over to whatever is at that position now.
    render(buildItems(300, "Other"));
    await menu.sync();

    // Left alone, the request would have gone on to bring the option flush
    // with the bottom of the menu.
    expect(container.scrollTop).toBe(0);
  });

  test("holds the reader's place when the options above them measure taller", async () => {
    const observer = installManualResizeObserver();
    const { container, menu, render } = setupPlaced({
      defaultHeight: MEASURED_HEIGHT,
    });
    container.scrollTop = 400;
    render();

    await menu.sync();
    await observer.deliverAll();

    // The options above the viewport rendered taller than the seed assumed, so
    // everything below them moved; the position is corrected by the same
    // amount so nothing shifts on screen.
    expect(container.scrollTop).not.toBe(400);
  });

  test("leaves the scroll position alone when the measurements are forgotten", async () => {
    const observer = installManualResizeObserver();
    const { container, menu, render } = setupPlaced({
      defaultHeight: MEASURED_HEIGHT,
    });
    container.scrollTop = 400;
    render();

    await menu.sync();
    await observer.deliverAll();
    const held = container.scrollTop;
    expect(held).not.toBe(400);

    menu.reset();

    // Forgetting the heights is not news that anything on screen moved, so
    // there is no place to hold; correcting against nothing would jerk the
    // reader for no reason.
    expect(container.scrollTop).toBe(held);
  });
});

/**
 * A list that resolved measured heights but was never windowed, which
 * `shouldVirtualizeMenu` reaches for any list at all once the consumer supplies
 * the `virtualize` prop: the threshold gate says yes on the count the *caller*
 * holds, while `virtualize` reports `isVirtualized: false` under 100 options.
 * So `isMeasured` is true and `isMeasuredWindow` is false, and the components
 * still route their opening and keyboard placements here, their own
 * DOM-placing fallback being gated on `!shouldVirtualize`.
 *
 * Nothing measured is on hand to place against, and none is coming: the
 * measurer is not observing below the threshold. What is on hand is every
 * option, rendered and laid out by the browser, so placement reads the DOM
 * exactly, wrapping included.
 */
describe("createMenuWindow: measured, below the threshold", () => {
  const UNWINDOWED_COUNT = 50;

  /**
   * A menu that scrolls and whose options sit where a browser would put them:
   * stacked at `ITEM_HEIGHT`, moving under the container as it scrolls.
   * `buildContainer` leaves both out, the cases above placing by arithmetic
   * without ever asking the DOM. `scrollIntoViewWithinMenu` needs both, since
   * it reads rects and gives up on a menu that cannot scroll.
   */
  function setupUnwindowed() {
    const harness = setup();
    const { container, menu } = harness;
    const items = buildItems(UNWINDOWED_COUNT);

    container.setAttribute("role", "listbox");
    Object.defineProperty(container, "scrollHeight", {
      value: UNWINDOWED_COUNT * ITEM_HEIGHT,
      configurable: true,
    });

    const state = menu.update({
      items,
      shouldVirtualize: true,
      virtualize: true,
      wrapOptions: true,
      scrollTop: container.scrollTop,
    });

    // The premise every case here rests on: measured heights resolved, no
    // window to hold them.
    expect(state.isMeasured).toBe(true);
    expect(state.isVirtualized).toBe(false);
    expect(state.itemsToRender).toHaveLength(UNWINDOWED_COUNT);

    renderOptions(container, state);
    Array.from(container.children).forEach((child, index) => {
      const option = child as HTMLElement;
      option.getBoundingClientRect = () => {
        const top = index * ITEM_HEIGHT - container.scrollTop;
        return {
          top,
          bottom: top + ITEM_HEIGHT,
          height: ITEM_HEIGHT,
        } as DOMRect;
      };
    });

    return harness;
  }

  test("places a top-aligned option where the DOM has it", () => {
    const { container, menu } = setupUnwindowed();

    menu.scrollIntoView(5, "top");

    expect(container.scrollTop).toBe(5 * ITEM_HEIGHT);
  });

  test("brings a nearest option off the window into view", () => {
    const { container, menu } = setupUnwindowed();

    menu.scrollIntoView(20, "nearest");

    // Option 20 runs to 840 against a viewport 300 tall, so it comes up to sit
    // against the bottom edge rather than the top.
    expect(container.scrollTop).toBe(21 * ITEM_HEIGHT - CONTAINER_HEIGHT);
  });

  test("leaves a nearest option already on screen alone", () => {
    const { container, menu, scrollTops } = setupUnwindowed();

    menu.scrollIntoView(2, "nearest");

    expect(container.scrollTop).toBe(0);
    expect(scrollTops).toEqual([]);
  });

  test("sends the menu to the top when there is nothing to show", () => {
    const { container, menu } = setupUnwindowed();
    container.scrollTop = 400;

    menu.scrollIntoView(-1, "top");

    expect(container.scrollTop).toBe(0);
  });

  test("reports the position it took, so the caller's mirror keeps up", () => {
    const { menu, scrollTops } = setupUnwindowed();

    menu.scrollIntoView(5, "top");

    expect(scrollTops.at(-1)).toBe(5 * ITEM_HEIGHT);
  });
});
