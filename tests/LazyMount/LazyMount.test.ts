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
