import { render, screen, waitFor } from "@testing-library/svelte";
import type { MotionValue } from "../../src/motion/context.js";
import type { TransitionProp } from "../../src/motion/resolve-transition.js";
import {
  fade,
  fly as flyExport,
  type FlyParams,
} from "../../src/motion/transitions.js";
import { user } from "../utils/user";
import OverflowMenuTransition from "./OverflowMenuTransition.test.svelte";

vi.mock("../../src/motion/transitions.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/motion/transitions.js")>();
  return { ...actual, fly: vi.fn(actual.fly) };
});

const fly = vi.mocked(flyExport);

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const trigger = () => screen.getByRole("button");
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
  portalMenu: boolean;
  transition?: TransitionProp<FlyParams>;
  motionMenu?: MotionValue;
  direction?: "top" | "bottom";
  onIntroStart?: () => void;
  onIntroEnd?: () => void;
  onOutroStart?: () => void;
  onOutroEnd?: () => void;
}) {
  const view = render(OverflowMenuTransition, props);
  await user.click(trigger());
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

describe.each([false, true])(
  "OverflowMenu transition (portalMenu=%s)",
  (portalMenu) => {
    it.each([undefined, false])(
      "removes the menu at once on close when %s",
      async (transition) => {
        render(OverflowMenuTransition, { portalMenu, transition });
        await user.click(trigger());
        expect(menu()).toBeInTheDocument();
        await sleep(DURATION * 4);

        await user.click(trigger());

        expect(menu()).not.toBeInTheDocument();
        expect(fly).not.toHaveBeenCalled();
      },
    );

    it("true flies the menu out before removing it, then fires outroend", async () => {
      const onOutroEnd = vi.fn();
      await openMenu({ portalMenu, transition: true, onOutroEnd });

      await user.click(trigger());
      expect(menu()).toBeInTheDocument();
      expect(onOutroEnd).not.toHaveBeenCalled();

      await waitFor(() => expect(menu()).not.toBeInTheDocument());
      expect(onOutroEnd).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["bottom", 2],
      ["top", -2],
    ] as const)(
      "true plays fast01, moving 2 px toward the %s side",
      async (direction, y) => {
        await openMenu({ portalMenu, transition: true, direction });

        expect(fly.mock.calls[0][1]).toEqual({
          duration: "fast01",
          opacity: 0,
          y,
        });
      },
    );

    it("takes the menu role from Motion", async () => {
      await openMenu({ portalMenu, motionMenu: { duration: "fast02" } });

      expect(fly.mock.calls[0][1]).toMatchObject({ duration: "fast02" });
    });

    it("lets its own transition win over Motion", async () => {
      await openMenu({ portalMenu, motionMenu: true, transition: false });

      expect(fly).not.toHaveBeenCalled();
    });

    it("params override the preset", async () => {
      await openMenu({
        portalMenu,
        transition: { duration: "fast02", y: 8 },
      });

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
      await openMenu({
        portalMenu,
        transition: { fn: spy, duration: DURATION },
      });

      await user.click(trigger());
      await waitFor(() => expect(menu()).not.toBeInTheDocument());

      expect(fly).not.toHaveBeenCalled();
      expect(calls.length).toBeGreaterThan(0);
      for (const params of calls)
        expect(params).toEqual({ duration: DURATION });
    });

    it("forwards the intro and outro events", async () => {
      const onIntroStart = vi.fn();
      const onIntroEnd = vi.fn();
      const onOutroStart = vi.fn();
      const onOutroEnd = vi.fn();
      await openMenu({
        portalMenu,
        transition: { duration: DURATION },
        onIntroStart,
        onIntroEnd,
        onOutroStart,
        onOutroEnd,
      });
      expect(onIntroStart).toHaveBeenCalledTimes(1);
      expect(onIntroEnd).toHaveBeenCalledTimes(1);

      await user.click(trigger());

      await waitFor(() => expect(onOutroStart).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(onOutroEnd).toHaveBeenCalledTimes(1));
    });

    it("removes the menu without waiting under reduced motion, and still fires outroend", async () => {
      stubReducedMotion(true);
      const onOutroEnd = vi.fn();
      await openMenu({
        portalMenu,
        transition: { duration: 10_000 },
        onOutroEnd,
      });

      await user.click(trigger());

      await waitFor(() => expect(menu()).not.toBeInTheDocument(), {
        timeout: 100,
      });
      expect(onOutroEnd).toHaveBeenCalledTimes(1);
    });

    it("closes the trigger, returns focus and takes no input while the menu leaves", async () => {
      await openMenu({
        portalMenu,
        transition: { duration: DURATION * 4 },
      });
      expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();
      expect(isInert(menu())).toBeFalsy();

      await user.keyboard("{Escape}");

      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(trigger()).toHaveFocus();
      expect(menu()).toBeInTheDocument();
      expect(menu()).toHaveClass("bx--overflow-menu-options--open");
      await waitFor(() => expect(isInert(menu())).toBe(true));
      await waitFor(() => expect(menu()).not.toBeInTheDocument());
    });

    it("closes the same way on Tab and on an outside click", async () => {
      await openMenu({
        portalMenu,
        transition: { duration: DURATION * 4 },
      });
      await user.keyboard("{Tab}");
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(isInert(menu())).toBe(true));
      await waitFor(() => expect(menu()).not.toBeInTheDocument());

      await user.click(trigger());
      await sleep(DURATION * 8);
      await user.click(document.body);

      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(menu()).toBeInTheDocument();
      await waitFor(() => expect(isInert(menu())).toBe(true));
    });

    it("reopening during the exit brings the same menu back live", async () => {
      const onOutroEnd = vi.fn();
      await openMenu({
        portalMenu,
        transition: { duration: DURATION * 4 },
        onOutroEnd,
      });

      await user.click(trigger());
      const leaving = menu();
      await user.click(trigger());
      await sleep(DURATION * 8);

      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      expect(menu()).toBe(leaving);
      expect(isInert(menu())).toBe(false);
      expect(onOutroEnd).not.toHaveBeenCalled();
    });

    it("tears down cleanly when unmounted mid-exit", async () => {
      const errors: unknown[] = [];
      const onError = (event: ErrorEvent) => errors.push(event.error);
      window.addEventListener("error", onError);

      const { unmount } = await openMenu({
        portalMenu,
        transition: { duration: DURATION * 2 },
      });
      await user.click(trigger());
      expect(menu()).toBeInTheDocument();

      unmount();
      await sleep(DURATION * 5);
      window.removeEventListener("error", onError);

      expect(menu()).not.toBeInTheDocument();
      expect(errors).toEqual([]);
    });
  },
);
