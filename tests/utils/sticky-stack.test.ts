import { isHeaderRendered } from "../../src/UIShell/nav-store.js";
import { joinStack, stickyContainer } from "../../src/utils/sticky-stack.js";
import { rect } from "./rect";

function bar(parent: HTMLElement, height: number, top?: string) {
  const node = document.createElement("div");
  if (top !== undefined) node.style.top = top;
  vi.spyOn(node, "getBoundingClientRect").mockReturnValue(rect({ height }));
  parent.append(node);
  return node;
}

/** Waits out the shared ResizeObserver's first delivery and the layout. */
async function settle() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

const root = () => document.documentElement;
const published = (element: HTMLElement) =>
  element.style.getPropertyValue("--ccs-sticky-offset");

describe("joinStack", () => {
  afterEach(() => {
    isHeaderRendered.set(false);
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("sticks stacked bars below the Header and each other, in DOM order", async () => {
    isHeaderRendered.set(true);
    const header = bar(document.body, 120);
    const toolbar = bar(document.body, 48);
    const tops = new Map<HTMLElement, number>();
    // Joined out of order: the stack follows the DOM.
    const second = joinStack(toolbar, true, (top) => tops.set(toolbar, top));
    const first = joinStack(header, true, (top) => tops.set(header, top));
    await settle();

    expect(tops.get(header)).toBe(48);
    expect(tops.get(toolbar)).toBe(168);
    expect(published(root())).toBe("216px");

    first.leave();
    await settle();
    expect(tops.get(toolbar)).toBe(48);
    expect(published(root())).toBe("96px");

    second.leave();
    expect(published(root())).toBe("");
  });

  it("stacks below a bar with a fixed top", async () => {
    const header = bar(document.body, 100, "16px");
    const toolbar = bar(document.body, 48);
    const onTop = vi.fn();
    const handles = [
      joinStack(header, false, vi.fn()),
      joinStack(toolbar, true, onTop),
    ];
    await settle();

    expect(onTop).toHaveBeenLastCalledWith(116);
    expect(published(root())).toBe("164px");
    for (const handle of handles) handle.leave();
  });

  it("publishes nothing while no bar stacks", async () => {
    isHeaderRendered.set(true);
    const handle = joinStack(bar(document.body, 48, "48px"), false, vi.fn());
    await settle();

    expect(published(root())).toBe("");
    handle.update(true);
    await settle();
    expect(published(root())).toBe("96px");
    handle.update(false);
    await settle();
    expect(published(root())).toBe("");
    handle.leave();
  });

  it("publishes on a scroll container of its own, without the Header", async () => {
    isHeaderRendered.set(true);
    const container = document.createElement("div");
    container.style.overflowY = "auto";
    document.body.append(container);
    const toolbar = bar(container, 48);
    const onTop = vi.fn();
    expect(stickyContainer(toolbar)).toBe(container);

    const handle = joinStack(toolbar, true, onTop);
    await settle();

    expect(onTop).toHaveBeenLastCalledWith(0);
    expect(published(container)).toBe("48px");
    expect(published(root())).toBe("");
    handle.leave();
    expect(published(container)).toBe("");
  });

  it("moves stacked bars when the Header mounts", async () => {
    const toolbar = bar(document.body, 48);
    const onTop = vi.fn();
    const handle = joinStack(toolbar, true, onTop);
    await settle();
    expect(onTop).toHaveBeenLastCalledWith(0);

    isHeaderRendered.set(true);
    await settle();
    expect(onTop).toHaveBeenLastCalledWith(48);
    handle.leave();
  });
});
