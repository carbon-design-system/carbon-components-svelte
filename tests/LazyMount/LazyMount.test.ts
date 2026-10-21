import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import {
  type IntersectionObserverMock,
  stubIntersectionObserver,
} from "../utils/intersection-observer-mock";
import LazyMount from "./LazyMount.test.svelte";
import LazyMountBind from "./LazyMountBind.test.svelte";

describe("LazyMount", () => {
  let instances: IntersectionObserverMock[];

  beforeEach(() => {
    ({ instances } = stubIntersectionObserver());
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
    expect(wrapper).toHaveAttribute("aria-busy", "true");

    const [observer] = instances;
    expect(observer.options).toEqual({ rootMargin: "600px", threshold: 0 });
    observer.trigger(wrapper, false);
    await tick();
    expect(screen.queryByText("Content 0")).toBeNull();

    observer.trigger(wrapper, true);
    await tick();
    expect(screen.getByText("Content 0")).toBeInTheDocument();
    expect(screen.queryByText("Loading 0")).toBeNull();
    expect(wrapper.style.minHeight).toBe("");
    expect(wrapper).not.toHaveAttribute("aria-busy");
    expect(onMount).toHaveBeenCalledTimes(1);
    expect(observer.elements.size).toBe(0);
  });

  it("shares one observer across instances", () => {
    render(LazyMount, { props: { count: 3 } });
    expect(instances).toHaveLength(1);
    expect(instances[0].elements.size).toBe(3);
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

  it("falls back to a timer for when='idle' without requestIdleCallback", async () => {
    vi.stubGlobal("requestIdleCallback", undefined);
    vi.useFakeTimers();
    try {
      render(LazyMount, { props: { when: "idle" } });
      await tick();
      expect(screen.queryByText("Content 0")).toBeNull();

      await vi.advanceTimersByTimeAsync(1);
      await tick();
      expect(screen.getByText("Content 0")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("waits again with the new rootMargin when it changes", async () => {
    const { rerender } = render(LazyMount, {
      props: { rootMargin: "100px" },
    });
    expect(instances.map((instance) => instance.options?.rootMargin)).toEqual([
      "100px",
    ]);

    await rerender({ rootMargin: "50px" });

    const [first, second] = instances;
    expect(first.elements.size).toBe(0);
    expect(second.options?.rootMargin).toBe("50px");
    expect(second.elements.size).toBe(1);
  });

  it("stops waiting when unmounted before it shows", () => {
    const { unmount } = render(LazyMount);
    const [observer] = instances;
    expect(observer.elements.size).toBe(1);

    unmount();

    expect(observer.elements.size).toBe(0);
  });

  it("dispatches mount once across later updates", async () => {
    const onMount = vi.fn();
    const { rerender } = render(LazyMount, {
      props: { eager: true, onMount },
    });
    await tick();
    expect(onMount).toHaveBeenCalledTimes(1);

    await rerender({ estimatedHeight: 300 });
    await rerender({ estimatedHeight: 400 });

    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it("mounts before printing", async () => {
    render(LazyMount);
    window.dispatchEvent(new Event("beforeprint"));
    await tick();
    expect(screen.getByText("Content 0")).toBeInTheDocument();
  });

  it("keeps mounted content when a parent writes mounted", async () => {
    const { component } = render(LazyMountBind);
    const [observer] = instances;
    observer.trigger(screen.getByTestId("lazy"), true);
    await tick();
    expect(component.mounted).toBe(true);

    component.mounted = false;
    await tick();
    await tick();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(component.mounted).toBe(true);
  });
});
