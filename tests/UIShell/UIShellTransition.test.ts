import { render, screen, waitFor } from "@testing-library/svelte";
import type { TransitionProp } from "../../src/motion/resolve-transition.js";
import { fade, type SlideParams } from "../../src/motion/transitions.js";
import UIShellTransition from "./UIShellTransition.test.svelte";

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const panel = () => screen.queryByTestId("panel");

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: reduce,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Open the panel, and let a Svelte 5 entrance finish. */
async function openPanel(props: {
  kind: "action" | "switcher" | "profile";
  transition?: TransitionProp<SlideParams>;
}) {
  const view = render(UIShellTransition, props);
  await view.rerender({ isOpen: true });
  expect(panel()).toBeInTheDocument();
  await sleep(DURATION * 4);
  return view;
}

beforeEach(() => {
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe.each(["action", "switcher", "profile"] as const)(
  "%s transition prop",
  (kind) => {
    it("removes the panel at once on close when unset", async () => {
      const { rerender } = await openPanel({ kind });

      await rerender({ isOpen: false });

      expect(panel()).not.toBeInTheDocument();
    });

    it("removes the panel at once on close when false", async () => {
      const { rerender } = await openPanel({ kind, transition: false });

      await rerender({ isOpen: false });

      expect(panel()).not.toBeInTheDocument();
    });

    it("true slides the panel out before removing it", async () => {
      const { rerender } = await openPanel({ kind, transition: true });

      await rerender({ isOpen: false });
      expect(panel()).toBeInTheDocument();

      await waitFor(() => expect(panel()).not.toBeInTheDocument());
    });

    it("accepts a token name for the duration", async () => {
      const { rerender } = await openPanel({
        kind,
        transition: { duration: "slow02" },
      });

      await rerender({ isOpen: false });
      await sleep(DURATION * 4);

      expect(panel()).toBeInTheDocument();
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
      const { rerender } = await openPanel({
        kind,
        transition: { fn: spy, duration: DURATION, delay: 1 },
      });

      await rerender({ isOpen: false });
      await waitFor(() => expect(panel()).not.toBeInTheDocument());

      expect(calls.length).toBeGreaterThan(0);
      for (const params of calls) {
        expect(params).toEqual({ duration: DURATION, delay: 1 });
      }
    });

    it("removes the panel without waiting under reduced motion", async () => {
      stubReducedMotion(true);
      const { rerender } = await openPanel({ kind, transition: true });

      await rerender({ isOpen: false });

      await waitFor(() => expect(panel()).not.toBeInTheDocument(), {
        timeout: 100,
      });
    });
  },
);
