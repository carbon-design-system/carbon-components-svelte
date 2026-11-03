import { render, screen, waitFor } from "@testing-library/svelte";
import type { TransitionProp } from "../../src/motion/resolve-transition.js";
import {
  fade,
  fly as flyExport,
  type FlyParams,
} from "../../src/motion/transitions.js";
import { user } from "../utils/user";
import MenuTransition from "./MenuTransition.test.svelte";

vi.mock("../../src/motion/transitions.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/motion/transitions.js")>();
  return { ...actual, fly: vi.fn(actual.fly) };
});

const fly = vi.mocked(flyExport);

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const menus = () => screen.queryAllByRole("menu");
const menu = () => screen.queryByRole("menu");
const isInert = (element: Element | null) =>
  (element as (HTMLElement & { inert: boolean }) | null)?.inert;

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: reduce,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Open the menu, and let a Svelte 5 entrance finish. */
async function openMenu(props: {
  transition?: TransitionProp<FlyParams>;
  direction?: "bottom" | "top" | "left" | "right";
  nested?: boolean;
  onOutroEnd?: () => void;
  onOutroStart?: () => void;
  onIntroStart?: () => void;
  onIntroEnd?: () => void;
}) {
  const view = render(MenuTransition, props);
  await view.rerender({ open: true });
  expect(menu()).toBeInTheDocument();
  await sleep(DURATION * 4);
  return view;
}

beforeEach(() => {
  fly.mockClear();
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("Menu transition prop", () => {
  it.each([undefined, false])(
    "removes the menu at once on close when %s",
    async (transition) => {
      const { rerender } = await openMenu({ transition });

      await rerender({ open: false });

      expect(menu()).not.toBeInTheDocument();
      expect(fly).not.toHaveBeenCalled();
    },
  );

  it("true flies the menu out before removing it, then fires outroend", async () => {
    const onOutroEnd = vi.fn();
    const { rerender } = await openMenu({ transition: true, onOutroEnd });

    await rerender({ open: false });
    expect(menu()).toBeInTheDocument();
    expect(onOutroEnd).not.toHaveBeenCalled();

    await waitFor(() => expect(menu()).not.toBeInTheDocument());
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("true plays fast01 at 2 px, fading from nothing", async () => {
    await openMenu({ transition: true });

    expect(fly).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      { duration: "fast01", opacity: 0, y: 2 },
      expect.anything(),
    );
  });

  it.each([
    ["bottom", { y: 2 }],
    ["top", { y: -2 }],
    ["right", { x: 2 }],
    ["left", { x: -2 }],
  ] as const)(
    "travels toward the %s side the menu opens on",
    async (direction, offset) => {
      await openMenu({ transition: true, direction });

      expect(fly.mock.calls[0][1]).toEqual({
        duration: "fast01",
        opacity: 0,
        ...offset,
      });
    },
  );

  it("params override the preset", async () => {
    await openMenu({ transition: { duration: "fast02", y: 8 } });

    expect(fly.mock.calls[0][1]).toEqual({
      duration: "fast02",
      opacity: 0,
      y: 8,
    });
  });

  it("fn swaps the transition, with no preset params and no fn in params", async () => {
    const calls: Record<string, unknown>[] = [];
    const spy = (
      node: Element,
      params: Record<string, unknown>,
      options: { direction: "in" | "out" | "both" },
    ) => {
      calls.push(params);
      return fade(node, params, options);
    };
    const { rerender } = await openMenu({
      transition: { fn: spy, duration: DURATION },
    });

    await rerender({ open: false });
    await waitFor(() => expect(menu()).not.toBeInTheDocument());

    expect(fly).not.toHaveBeenCalled();
    expect(calls.length).toBeGreaterThan(0);
    for (const params of calls) expect(params).toEqual({ duration: DURATION });
  });

  it("forwards the intro and outro events", async () => {
    const onIntroStart = vi.fn();
    const onIntroEnd = vi.fn();
    const onOutroStart = vi.fn();
    const onOutroEnd = vi.fn();
    const { rerender } = await openMenu({
      transition: { duration: DURATION },
      onIntroStart,
      onIntroEnd,
      onOutroStart,
      onOutroEnd,
    });
    expect(onIntroStart).toHaveBeenCalledTimes(1);
    expect(onIntroEnd).toHaveBeenCalledTimes(1);

    await rerender({ open: false });
    await waitFor(() => expect(onOutroStart).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onOutroEnd).toHaveBeenCalledTimes(1));
  });

  it("removes the menu without waiting under reduced motion, and still fires outroend", async () => {
    stubReducedMotion(true);
    const onOutroEnd = vi.fn();
    const { rerender } = await openMenu({
      transition: { duration: 10_000 },
      onOutroEnd,
    });

    await rerender({ open: false });

    await waitFor(() => expect(menu()).not.toBeInTheDocument(), {
      timeout: 100,
    });
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("keeps the open styling and takes no input while it leaves", async () => {
    const { rerender } = await openMenu({
      transition: { duration: DURATION * 4 },
    });
    expect(isInert(menu())).toBeFalsy();

    await rerender({ open: false });

    expect(menu()).toHaveClass("bx--menu--open");
    await waitFor(() => expect(isInert(menu())).toBe(true));
  });

  it("returns focus to the trigger at once on Escape, before the exit ends", async () => {
    await openMenu({ transition: { duration: DURATION * 4 } });
    expect(screen.getByRole("menuitem", { name: "First" })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "Trigger" })).toHaveFocus();
    expect(menu()).toBeInTheDocument();
    await waitFor(() => expect(isInert(menu())).toBe(true));
    await waitFor(() => expect(menu()).not.toBeInTheDocument());
  });

  it("reopening during the exit brings the same menu back live", async () => {
    const onOutroEnd = vi.fn();
    const { rerender } = await openMenu({
      transition: { duration: DURATION * 4 },
      onOutroEnd,
    });

    await rerender({ open: false });
    const leaving = menu();
    await rerender({ open: true });
    await sleep(DURATION * 8);

    expect(menu()).toBe(leaving);
    expect(isInert(menu())).toBe(false);
    expect(onOutroEnd).not.toHaveBeenCalled();
  });

  it("closing a parent plays one exit for the whole tree, not one per submenu", async () => {
    const onOutroEnd = vi.fn();
    const { rerender } = await openMenu({
      transition: { duration: DURATION * 2 },
      nested: true,
      onOutroEnd,
    });
    await user.click(screen.getByRole("menuitem", { name: "More" }));
    await waitFor(() => expect(menus()).toHaveLength(2));
    await sleep(DURATION * 4);

    await rerender({ open: false });
    expect(menus()).toHaveLength(2);
    await waitFor(() => expect(onOutroEnd).toHaveBeenCalledTimes(1));

    // The submenu leaves with its parent: nothing is left to animate.
    expect(menus()).toHaveLength(0);
    await sleep(DURATION * 4);
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("a submenu animates like its parent", async () => {
    await openMenu({ transition: { duration: DURATION }, nested: true });
    fly.mockClear();

    await user.click(screen.getByRole("menuitem", { name: "More" }));
    await waitFor(() => expect(menus()).toHaveLength(2));

    expect(fly.mock.calls[0][1]).toMatchObject({ duration: DURATION });
  });

  it("tears down cleanly when unmounted mid-exit", async () => {
    const onOutroEnd = vi.fn();
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);

    const { rerender, unmount } = await openMenu({
      transition: { duration: DURATION * 2 },
      onOutroEnd,
    });
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
