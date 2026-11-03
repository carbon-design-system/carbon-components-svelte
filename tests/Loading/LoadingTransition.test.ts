import { render, screen, waitFor } from "@testing-library/svelte";
import { fade } from "../../src/motion/transitions.js";
import LoadingTransition from "./LoadingTransition.test.svelte";

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

describe.each(["overlay", "bare", "inline"] as const)(
  "%s transition prop",
  (kind) => {
    it("removes the element at once when unset", async () => {
      const { rerender } = render(LoadingTransition, { kind });
      expect(target()).toBeInTheDocument();

      await rerender({ show: false });

      expect(target()).not.toBeInTheDocument();
    });

    it("fades out before removing, then fires outroend", async () => {
      const onOutroEnd = vi.fn();
      const { rerender } = render(LoadingTransition, {
        kind,
        transition: { duration: DURATION },
        onOutroEnd,
      });
      await sleep(DURATION * 3);

      await rerender({ show: false });
      expect(target()).toBeInTheDocument();
      expect(onOutroEnd).not.toHaveBeenCalled();

      await waitFor(() => expect(target()).not.toBeInTheDocument());
      expect(onOutroEnd).toHaveBeenCalledTimes(1);
    });

    it("true uses the preset", async () => {
      const { rerender } = render(LoadingTransition, {
        kind,
        transition: true,
      });
      await sleep(DURATION * 3);

      await rerender({ show: false });
      expect(target()).toBeInTheDocument();

      await waitFor(() => expect(target()).not.toBeInTheDocument());
    });

    it("removes the element without waiting under reduced motion", async () => {
      stubReducedMotion(true);
      const onOutroEnd = vi.fn();
      const { rerender } = render(LoadingTransition, {
        kind,
        transition: { duration: 10_000 },
        onOutroEnd,
      });

      await rerender({ show: false });

      await waitFor(() => expect(target()).not.toBeInTheDocument(), {
        timeout: 100,
      });
      expect(onOutroEnd).toHaveBeenCalledTimes(1);
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
      const { rerender } = render(LoadingTransition, {
        kind,
        transition: { fn: spy, duration: DURATION },
      });
      await sleep(DURATION * 3);

      await rerender({ show: false });
      await waitFor(() => expect(target()).not.toBeInTheDocument());

      expect(calls.length).toBeGreaterThan(0);
      expect(calls.at(-1)).toEqual({ duration: DURATION });
    });

    it("tears down cleanly when unmounted mid-exit", async () => {
      const onOutroEnd = vi.fn();
      const errors: unknown[] = [];
      const onError = (event: ErrorEvent) => errors.push(event.error);
      window.addEventListener("error", onError);

      const { rerender, unmount } = render(LoadingTransition, {
        kind,
        transition: { duration: DURATION * 2 },
        onOutroEnd,
      });
      await sleep(DURATION * 5);
      await rerender({ show: false });
      expect(target()).toBeInTheDocument();

      unmount();
      await sleep(DURATION * 5);
      window.removeEventListener("error", onError);

      expect(target()).not.toBeInTheDocument();
      expect(errors).toEqual([]);
      expect(onOutroEnd).not.toHaveBeenCalled();
    });
  },
);

describe("overlay", () => {
  it("is inert while it leaves, so it cannot hold focus or clicks", async () => {
    const { rerender } = render(LoadingTransition, {
      kind: "overlay",
      transition: { duration: DURATION * 4 },
    });
    await sleep(DURATION * 8);

    await rerender({ show: false });

    expect((target() as HTMLElement & { inert: boolean }).inert).toBe(true);
  });

  it("releases its document listeners when unmounted mid-exit", async () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const focusin = (spy: typeof add) =>
      spy.mock.calls.filter(([type]) => type === "focusin").length;

    const { rerender, unmount } = render(LoadingTransition, {
      kind: "overlay",
      transition: { duration: DURATION * 4 },
    });
    await sleep(DURATION * 8);
    await rerender({ show: false });
    unmount();

    expect(focusin(add)).toBeGreaterThan(0);
    expect(focusin(remove)).toBe(focusin(add));
  });
});
