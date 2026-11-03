import { render, screen, waitFor } from "@testing-library/svelte";
import type * as TransitionsModule from "../../src/motion/transitions.js";
import { fade, slide } from "../../src/motion/transitions.js";
import ListBoxMenuTransition from "./ListBoxMenuTransition.test.svelte";

// Wrap the Carbon slide and fade so the test can see the params they run with.
vi.mock("../../src/motion/transitions.js", async (importOriginal) => {
  const original = await importOriginal<typeof TransitionsModule>();
  return {
    ...original,
    slide: vi.fn(original.slide),
    fade: vi.fn(original.fade),
  };
});

/** The preset's transition: a slide in place, a fade in a portal. */
const preset = (portal: boolean) => vi.mocked(portal ? fade : slide);

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const menu = () => screen.queryByTestId("target");

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: reduce,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

beforeEach(() => {
  vi.mocked(slide).mockClear();
  vi.mocked(fade).mockClear();
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe.each([
  ["in place", false],
  ["in a portal", true],
])("%s", (_, portal) => {
  it.each([
    ["unset", undefined],
    ["false", false],
  ])("removes the menu at once when transition is %s", async (_, value) => {
    const { rerender } = render(ListBoxMenuTransition, {
      portal,
      transition: value,
    });
    expect(menu()).toBeInTheDocument();

    await rerender({ open: false });

    expect(menu()).not.toBeInTheDocument();
    expect(slide).not.toHaveBeenCalled();
    expect(fade).not.toHaveBeenCalled();
  });

  it("true plays the preset at fast02 and keeps the menu until outroend", async () => {
    const onOutroEnd = vi.fn();
    const { rerender } = render(ListBoxMenuTransition, {
      portal,
      transition: true,
      onOutroEnd,
    });
    await sleep(DURATION * 4);

    await rerender({ open: false });
    expect(menu()).toBeInTheDocument();
    expect(onOutroEnd).not.toHaveBeenCalled();

    await waitFor(() => expect(menu()).not.toBeInTheDocument());
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
    expect(preset(portal).mock.calls.at(-1)?.[1]).toEqual({
      duration: "fast02",
    });
  });

  it("params override the preset", async () => {
    const { rerender } = render(ListBoxMenuTransition, {
      portal,
      transition: { duration: DURATION * 2 },
    });
    await sleep(DURATION * 4);

    await rerender({ open: false });

    expect(preset(portal).mock.calls.at(-1)?.[1]).toEqual({
      duration: DURATION * 2,
    });
    await waitFor(() => expect(menu()).not.toBeInTheDocument());
  });

  it("fn swaps the transition without the preset's params", async () => {
    const calls: Record<string, unknown>[] = [];
    const spy = (
      node: Element,
      params: Record<string, unknown>,
      options: { direction: "in" | "out" | "both" },
    ) => {
      calls.push(params);
      return fade(node, params, options);
    };
    const { rerender } = render(ListBoxMenuTransition, {
      portal,
      transition: { fn: spy, duration: DURATION },
    });
    await sleep(DURATION * 4);

    await rerender({ open: false });
    await waitFor(() => expect(menu()).not.toBeInTheDocument());

    expect(preset(portal)).not.toHaveBeenCalledWith(
      expect.anything(),
      { duration: "fast02" },
      expect.anything(),
    );
    expect(calls.at(-1)).toEqual({ duration: DURATION });
  });

  it("removes the menu without waiting under reduced motion", async () => {
    stubReducedMotion(true);
    const onOutroEnd = vi.fn();
    const { rerender } = render(ListBoxMenuTransition, {
      portal,
      transition: { duration: 10_000 },
      onOutroEnd,
    });

    await rerender({ open: false });

    await waitFor(() => expect(menu()).not.toBeInTheDocument(), {
      timeout: 100,
    });
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("is inert while it leaves, and live again when reopened", async () => {
    const { rerender } = render(ListBoxMenuTransition, {
      portal,
      transition: { duration: DURATION * 6 },
    });
    await sleep(DURATION * 8);
    const leaving = menu() as HTMLElement & { inert: boolean };

    await rerender({ open: false });
    expect(menu()).toBe(leaving);
    expect(leaving.inert).toBe(true);

    await rerender({ open: true });
    await sleep(DURATION);
    expect(menu()).toBe(leaving);
    expect(leaving.inert).toBe(false);
  });

  it("tears down cleanly when unmounted mid-exit", async () => {
    const onOutroEnd = vi.fn();
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);

    const { rerender, unmount } = render(ListBoxMenuTransition, {
      portal,
      transition: { duration: DURATION * 2 },
      onOutroEnd,
    });
    await sleep(DURATION * 5);
    await rerender({ open: false });
    expect(menu()).toBeInTheDocument();

    unmount();
    await sleep(DURATION * 5);
    window.removeEventListener("error", onError);

    expect(menu()).not.toBeInTheDocument();
    expect(errors).toEqual([]);
    expect(onOutroEnd).not.toHaveBeenCalled();
  });
});

it("keeps the portal where it opened while the menu leaves", async () => {
  const { rerender } = render(ListBoxMenuTransition, {
    portal: true,
    transition: { duration: DURATION * 4 },
  });
  await sleep(DURATION * 8);
  const portal = document.querySelector<HTMLElement>("[data-floating-portal]");
  const placed = portal?.getAttribute("style");
  expect(placed).toContain("top:");

  await rerender({ open: false });
  await sleep(DURATION);

  expect(document.querySelector("[data-floating-portal]")).toBe(portal);
  expect(portal?.getAttribute("style")).toBe(placed);
});
