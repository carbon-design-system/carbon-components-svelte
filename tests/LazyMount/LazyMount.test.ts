import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import LazyMount from "./LazyMount.test.svelte";

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

describe("LazyMount", () => {
  beforeEach(() => {
    IntersectionObserverMock.instances = [];
    // A fresh class per test: shared observers are kept per constructor.
    vi.stubGlobal(
      "IntersectionObserver",
      class extends IntersectionObserverMock {},
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("holds a placeholder until the wrapper nears the viewport", async () => {
    const onMount = vi.fn();
    render(LazyMount, { props: { onMount } });
    const wrapper = screen.getByTestId("lazy-0");

    expect(screen.getByText("Loading 0")).toBeInTheDocument();
    expect(screen.queryByText("Content 0")).toBeNull();
    expect(wrapper).toHaveStyle({ minHeight: "200px" });

    const [observer] = IntersectionObserverMock.instances;
    expect(observer.options).toEqual({ rootMargin: "600px", threshold: 0 });
    observer.trigger(wrapper, false);
    await tick();
    expect(screen.queryByText("Content 0")).toBeNull();

    observer.trigger(wrapper, true);
    await tick();
    expect(screen.getByText("Content 0")).toBeInTheDocument();
    expect(screen.queryByText("Loading 0")).toBeNull();
    expect(wrapper.style.minHeight).toBe("");
    expect(onMount).toHaveBeenCalledTimes(1);
    expect(observer.elements.size).toBe(0);
  });

  it("shares one observer across instances", () => {
    render(LazyMount, { props: { count: 3 } });
    expect(IntersectionObserverMock.instances).toHaveLength(1);
    expect(IntersectionObserverMock.instances[0].elements.size).toBe(3);
  });

  it("renders right away with eager", async () => {
    const onMount = vi.fn();
    render(LazyMount, { props: { eager: true, onMount } });
    await tick();
    expect(screen.getByText("Content 0")).toBeInTheDocument();
    expect(screen.getByTestId("lazy-0").style.minHeight).toBe("");
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it("renders without IntersectionObserver", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(LazyMount);
    await tick();
    await tick();
    expect(screen.getByText("Content 0")).toBeInTheDocument();
  });

  it("mounts when the browser is idle with when='idle'", async () => {
    let idle: (() => void) | undefined;
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
      idle = callback;
      return 1;
    });
    vi.stubGlobal("cancelIdleCallback", vi.fn());
    render(LazyMount, { props: { when: "idle" } });
    expect(screen.queryByText("Content 0")).toBeNull();

    idle?.();
    await tick();
    expect(screen.getByText("Content 0")).toBeInTheDocument();
  });

  it("mounts before printing", async () => {
    render(LazyMount);
    window.dispatchEvent(new Event("beforeprint"));
    await tick();
    expect(screen.getByText("Content 0")).toBeInTheDocument();
  });
});
