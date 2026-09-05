import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import ScrollGradient from "./ScrollGradient.test.svelte";

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];

  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  elements = new Set<Element>();

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.options = options;
    IntersectionObserverMock.instances.push(this);
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

  trigger(target: Element, isIntersecting: boolean) {
    this.callback(
      [{ target, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

beforeEach(() => {
  IntersectionObserverMock.instances = [];
  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Fake overflow on `element` and let the mocked `ResizeObserver` report it. */
async function markScrollable(
  element: HTMLElement,
  { x = false, y = false }: { x?: boolean; y?: boolean },
) {
  Object.defineProperty(element, "clientWidth", {
    value: 100,
    configurable: true,
  });
  Object.defineProperty(element, "scrollWidth", {
    value: x ? 200 : 100,
    configurable: true,
  });
  Object.defineProperty(element, "clientHeight", {
    value: 100,
    configurable: true,
  });
  Object.defineProperty(element, "scrollHeight", {
    value: y ? 200 : 100,
    configurable: true,
  });
  // The ResizeObserver mock delivers its first callback on a microtask.
  await Promise.resolve();
  await tick();
}

/** [top, bottom, left, right], matching the component's sentinel markup order. */
function getSentinels(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll(".bx--scroll-gradient__sentinel"),
  );
}

function getObserverFor(scrollElement: Element) {
  const observer = IntersectionObserverMock.instances.find(
    (instance) => instance.options?.root === scrollElement,
  );
  if (!observer) throw new Error("No IntersectionObserver found for root");
  return observer;
}

describe("ScrollGradient", () => {
  it("shows no gradients when content does not overflow", async () => {
    const { container } = render(ScrollGradient);
    await tick();

    expect(
      container.querySelectorAll(".bx--scroll-gradient__gradient"),
    ).toHaveLength(0);
  });

  it("shows the top and bottom gradients once scrolled past the start", async () => {
    const { container } = render(ScrollGradient);
    const scrollElement = container.querySelector(
      ".bx--scroll-gradient__scroll-element",
    ) as HTMLElement;

    await markScrollable(scrollElement, { y: true });
    expect(
      container.querySelectorAll(".bx--scroll-gradient__gradient"),
    ).toHaveLength(0);

    const [top, bottom] = getSentinels(container);
    const observer = getObserverFor(scrollElement);

    observer.trigger(top, false);
    await tick();
    expect(
      container.querySelector(".bx--scroll-gradient__gradient--top"),
    ).not.toBeNull();
    expect(
      container.querySelector(".bx--scroll-gradient__gradient--bottom"),
    ).toBeNull();

    observer.trigger(bottom, false);
    await tick();
    expect(
      container.querySelector(".bx--scroll-gradient__gradient--bottom"),
    ).not.toBeNull();

    observer.trigger(top, true);
    await tick();
    expect(
      container.querySelector(".bx--scroll-gradient__gradient--top"),
    ).toBeNull();
  });

  it("suppresses the top and left gradients when hideStartGradient is set", async () => {
    const { container } = render(ScrollGradient, {
      props: { hideStartGradient: true },
    });
    const scrollElement = container.querySelector(
      ".bx--scroll-gradient__scroll-element",
    ) as HTMLElement;

    await markScrollable(scrollElement, { x: true, y: true });
    const [top, bottom, left, right] = getSentinels(container);
    const observer = getObserverFor(scrollElement);

    observer.trigger(top, false);
    observer.trigger(bottom, false);
    observer.trigger(left, false);
    observer.trigger(right, false);
    await tick();

    expect(
      container.querySelector(".bx--scroll-gradient__gradient--top"),
    ).toBeNull();
    expect(
      container.querySelector(".bx--scroll-gradient__gradient--left"),
    ).toBeNull();
    expect(
      container.querySelector(".bx--scroll-gradient__gradient--bottom"),
    ).not.toBeNull();
    expect(
      container.querySelector(".bx--scroll-gradient__gradient--right"),
    ).not.toBeNull();
  });

  it("applies the color prop to the gradient overlays", async () => {
    const { container } = render(ScrollGradient, {
      props: { color: "red" },
    });
    const scrollElement = container.querySelector(
      ".bx--scroll-gradient__scroll-element",
    ) as HTMLElement;

    await markScrollable(scrollElement, { y: true });
    const [top] = getSentinels(container);
    getObserverFor(scrollElement).trigger(top, false);
    await tick();

    const wrapper = container.querySelector(
      ".bx--scroll-gradient",
    ) as HTMLElement;
    expect(wrapper.style.getPropertyValue("--cds-scroll-gradient-color")).toBe(
      "red",
    );
  });
});
