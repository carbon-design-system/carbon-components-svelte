import { render, screen, waitFor } from "@testing-library/svelte";
import { easing } from "../../src/motion/tokens.js";
import { fade, fly, slide } from "../../src/motion/transitions.js";
import MotionInOut from "./MotionInOut.test.svelte";
import MotionTransition from "./MotionTransition.test.svelte";

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const target = () => screen.queryByTestId("target");

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: reduce,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

beforeEach(() => {
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
});

afterEach(() => vi.unstubAllGlobals());

// A Svelte 5 mount runs the entrance too. An exit that starts before it ends
// is only as long as the progress the entrance made, so each test waits the
// entrance out first.
describe.each([
  ["fade", fade],
  ["slide", slide],
  ["fly", fly],
])("%s as transition:|global", (_name, transition) => {
  it("keeps the element until the exit ends, then fires outroend", async () => {
    const onOutroEnd = vi.fn();
    const { rerender } = render(MotionTransition, {
      transition,
      params: { duration: DURATION },
      onOutroEnd,
    });
    await sleep(DURATION * 3);

    await rerender({ show: false });
    expect(target()).toBeInTheDocument();
    expect(onOutroEnd).not.toHaveBeenCalled();

    await waitFor(() => expect(target()).not.toBeInTheDocument());
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("removes the element at once under reduced motion, and still fires outroend", async () => {
    stubReducedMotion(true);
    const onOutroEnd = vi.fn();
    const { rerender } = render(MotionTransition, {
      transition,
      params: { duration: 10_000 },
      onOutroEnd,
    });

    await rerender({ show: false });
    await waitFor(() => expect(target()).not.toBeInTheDocument());
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("reducedMotion: 'ignore' still animates the exit", async () => {
    stubReducedMotion(true);
    const { rerender } = render(MotionTransition, {
      transition,
      params: { duration: DURATION * 4, reducedMotion: "ignore" },
    });
    await sleep(DURATION * 8);

    await rerender({ show: false });
    await sleep(DURATION);
    expect(target()).toBeInTheDocument();
    await waitFor(() => expect(target()).not.toBeInTheDocument());
  });

  it("tears down cleanly when unmounted mid-exit", async () => {
    const onOutroEnd = vi.fn();
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);

    const { rerender, unmount, container } = render(MotionTransition, {
      transition,
      params: { duration: DURATION * 2 },
      onOutroEnd,
    });
    await sleep(DURATION * 5);
    await rerender({ show: false });
    expect(target()).toBeInTheDocument();

    unmount();
    expect(container.querySelector("[data-testid]")).toBeNull();
    // Let the abandoned exit's timers and frames fire.
    await sleep(DURATION * 5);
    window.removeEventListener("error", onError);

    expect(errors).toEqual([]);
    expect(onOutroEnd).not.toHaveBeenCalled();
  });

  it("cancels the exit when shown again mid-exit", async () => {
    const onOutroEnd = vi.fn();
    const { rerender } = render(MotionTransition, {
      transition,
      params: { duration: DURATION * 4 },
      onOutroEnd,
    });
    await sleep(DURATION * 8);

    await rerender({ show: false });
    await rerender({ show: true });
    await sleep(DURATION * 8);

    expect(target()).toBeInTheDocument();
    expect(onOutroEnd).not.toHaveBeenCalled();
  });
});

describe("direction", () => {
  function recordEasing() {
    const seen: [string | undefined, (t: number) => number][] = [];
    function spy(
      node: Element,
      params: Record<string, unknown>,
      options: { direction: "in" | "out" | "both" },
    ) {
      const config = fade(node, params, options);
      if (config.easing) seen.push([options?.direction, config.easing]);
      return config;
    }
    return { seen, spy };
  }

  // Svelte 3 and 4 call a `transition:` function with "both" every time and
  // throw on a function config, so the curve is the standard one on all three.
  it("transition: takes the standard curve for the exit", async () => {
    const { seen, spy } = recordEasing();
    const { rerender } = render(MotionTransition, {
      transition: spy,
      params: { duration: DURATION },
    });
    await sleep(DURATION * 3);
    await rerender({ show: false });
    await waitFor(() => expect(target()).not.toBeInTheDocument());

    const [direction, exit] = seen.at(-1) ?? [];
    expect(direction).toBe("both");
    expect(exit?.(0.4)).toBe(easing.standard.productive(0.4));
  });

  it("in: and out: take the entrance and exit curves", async () => {
    const { seen, spy } = recordEasing();
    const { rerender } = render(MotionInOut, {
      transition: spy,
      params: { duration: DURATION },
    });
    await rerender({ show: true });
    await sleep(DURATION * 3);
    await rerender({ show: false });
    await waitFor(() => expect(target()).not.toBeInTheDocument());

    expect(seen.map(([direction]) => direction)).toEqual(["in", "out"]);
    expect(seen[0][1](0.4)).toBe(easing.entrance.productive(0.4));
    expect(seen[1][1](0.4)).toBe(easing.exit.productive(0.4));
  });
});
