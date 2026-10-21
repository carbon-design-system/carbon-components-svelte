import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { expectInlineStyle } from "../utils/inline-style";
import {
  type IntersectionObserverMock,
  stubIntersectionObserver,
} from "../utils/intersection-observer-mock";
import ScrollGradientRef from "./ScrollGradient.ref.test.svelte";
import ScrollGradient from "./ScrollGradient.test.svelte";

let instances: IntersectionObserverMock[];

beforeEach(() => {
  ({ instances } = stubIntersectionObserver());
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
  const observer = instances.find(
    (instance) => instance.options?.root === scrollElement,
  );
  if (!observer) throw new Error("No IntersectionObserver found for root");
  return observer;
}

describe("ScrollGradient", () => {
  it("observes the scroll element and its content instead of mutations", async () => {
    const observe = vi.spyOn(ResizeObserver.prototype, "observe");
    const MutationObserverSpy = vi.fn();
    vi.stubGlobal("MutationObserver", MutationObserverSpy);

    const { container } = render(ScrollGradient);
    await tick();

    const scrollElement = container.querySelector(
      ".bx--scroll-gradient__scroll-element",
    );
    const content = container.querySelector(".bx--scroll-gradient__content");
    const observed = observe.mock.calls.map(([element]) => element);
    expect(observed).toContain(scrollElement);
    expect(observed).toContain(content);
    expect(MutationObserverSpy).not.toHaveBeenCalled();
    observe.mockRestore();
  });

  it("shares one ResizeObserver across instances and stops observing on unmount", async () => {
    let created = 0;
    const observed = new Set<Element>();
    const Base = globalThis.ResizeObserver;
    vi.stubGlobal(
      "ResizeObserver",
      class extends Base {
        constructor(callback: ResizeObserverCallback) {
          super(callback);
          created++;
        }
        observe(element: Element) {
          observed.add(element);
          super.observe(element);
        }
        unobserve(element: Element) {
          observed.delete(element);
          super.unobserve(element);
        }
      },
    );

    const first = render(ScrollGradient);
    const second = render(ScrollGradient);
    await tick();

    expect(created).toBe(1);
    expect(observed.size).toBe(4);

    first.unmount();
    second.unmount();
    expect(observed.size).toBe(0);
  });

  it("shows no gradients when content does not overflow", async () => {
    const { container } = render(ScrollGradient);
    const scrollElement = container.querySelector(
      ".bx--scroll-gradient__scroll-element",
    );
    assert(scrollElement instanceof HTMLElement);

    await markScrollable(scrollElement, {});
    const observer = getObserverFor(scrollElement);

    // The sentinels leave view in every direction, but there is nothing to
    // scroll, so no gradient may appear.
    for (const sentinel of getSentinels(container)) {
      observer.trigger(sentinel, false);
    }
    await tick();

    expect(
      container.querySelectorAll(".bx--scroll-gradient__gradient"),
    ).toHaveLength(0);
  });

  it("shows the top and bottom gradients once scrolled past the start", async () => {
    const { container } = render(ScrollGradient);
    const scrollElement = container.querySelector(
      ".bx--scroll-gradient__scroll-element",
    );
    assert(scrollElement instanceof HTMLElement);

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
    );
    assert(scrollElement instanceof HTMLElement);

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

  it.each([
    [
      "color",
      { color: "red" },
      ".bx--scroll-gradient",
      (element: HTMLElement) =>
        element.style.getPropertyValue("--cds-scroll-gradient-color"),
      "red",
    ],
    [
      "background",
      { background: "transparent" },
      ".bx--scroll-gradient__scroll-element",
      (element: HTMLElement) => element.style.backgroundColor,
      "transparent",
    ],
    [
      "height",
      { height: "100vh" },
      ".bx--scroll-gradient",
      (element: HTMLElement) => element.style.height,
      "100vh",
    ],
  ])(
    "applies the %s prop as an inline style",
    (_name, props, selector, read, expected) => {
      const { container } = render(ScrollGradient, { props });

      const element = container.querySelector(selector);
      assert(element instanceof HTMLElement);
      expect(read(element)).toBe(expected);
    },
  );

  it("maps fill token names to classes instead of inline styles", () => {
    const { container } = render(ScrollGradient, {
      props: {
        color: "background",
        background: "layer-accent",
        className: "x",
      },
    });

    const wrapper = container.querySelector<HTMLElement>(
      ".bx--scroll-gradient",
    );
    const scrollElement = container.querySelector<HTMLElement>(
      ".bx--scroll-gradient__scroll-element",
    );
    assert(wrapper);
    assert(scrollElement);
    // Static theme sheets define no `--cds-*` properties, so a token name
    // must not become an inline `var(--cds-*)`.
    expect(wrapper).toHaveClass("bx--scroll-gradient--color-background", "x");
    expect(scrollElement).toHaveClass(
      "bx--scroll-gradient__scroll-element--layer-accent",
    );
    expectInlineStyle(wrapper, { "--cds-scroll-gradient-color": "" });
    expectInlineStyle(scrollElement, { backgroundColor: "" });
  });

  it("binds `scrollElementRef` to the inner scrollable element", async () => {
    render(ScrollGradientRef);
    await tick();

    expect(screen.getByTestId("scroll-element-class")).toHaveTextContent(
      "bx--scroll-gradient__scroll-element",
    );
  });
});
