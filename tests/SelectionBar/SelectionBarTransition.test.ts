import { render, screen, waitFor } from "@testing-library/svelte";
import type * as TransitionsModule from "../../src/motion/transitions.js";
import { fly, slide } from "../../src/motion/transitions.js";
import SelectionBarTransition from "./SelectionBarTransition.test.svelte";

// Wrap the presets so the test can see which one plays, and its params.
vi.mock("../../src/motion/transitions.js", async (importOriginal) => {
  const original = await importOriginal<typeof TransitionsModule>();
  return {
    ...original,
    fly: vi.fn(original.fly),
    slide: vi.fn(original.slide),
  };
});

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const bar = () => screen.queryByTestId("bar");

beforeEach(() => {
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("SelectionBar transition prop", () => {
  it("removes the bar at once when unset", async () => {
    const { rerender } = render(SelectionBarTransition, { count: 1 });
    expect(bar()).toBeInTheDocument();
    await rerender({ count: 0 });
    expect(bar()).not.toBeInTheDocument();
    expect(fly).not.toHaveBeenCalled();
    expect(slide).not.toHaveBeenCalled();
  });

  it.each([
    ["content", slide, fly],
    ["viewport-end", fly, slide],
  ] as const)(
    "plays its preset for %s, then removes the bar",
    async (placement, preset, other) => {
      const { rerender } = render(SelectionBarTransition, {
        count: 0,
        placement,
        transition: { duration: DURATION },
      });
      await rerender({ count: 1 });
      expect(bar()).toBeInTheDocument();
      await sleep(DURATION * 4);

      await rerender({ count: 0 });
      expect(bar()).toBeInTheDocument();
      await waitFor(() => expect(bar()).not.toBeInTheDocument());
      expect(preset).toHaveBeenCalled();
      expect(other).not.toHaveBeenCalled();
      if (placement === "viewport-end") {
        expect(vi.mocked(fly).mock.calls[0][1]).toMatchObject({ y: "100%" });
      }
    },
  );
});
