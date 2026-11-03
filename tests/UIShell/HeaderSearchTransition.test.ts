import { render, screen, waitFor } from "@testing-library/svelte";
import type { TransitionProp } from "../../src/motion/resolve-transition.js";
import { fade, slide, type SlideParams } from "../../src/motion/transitions.js";
import HeaderSearchTransition from "./HeaderSearchTransition.test.svelte";

vi.mock("../../src/motion/transitions.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/motion/transitions.js")>();
  return { ...actual, slide: vi.fn(actual.slide) };
});

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const menu = () =>
  document.querySelector<HTMLElement>('[role="menu"], [role="listbox"]');

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: reduce,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Open the search, and let a Svelte 5 entrance finish. */
async function openSearch(props: {
  kind: "results" | "rich";
  transition?: TransitionProp<SlideParams>;
  motionMenu?: boolean | { duration?: number };
  onEvent?: (name: string) => void;
  onSelect?: () => void;
}) {
  const view = render(HeaderSearchTransition, props);
  await view.rerender({ active: true });
  await waitFor(() => expect(menu()).toBeInTheDocument());
  await sleep(DURATION * 4);
  return view;
}

beforeEach(() => {
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
  vi.mocked(slide).mockClear();
});

afterEach(() => vi.unstubAllGlobals());

describe.each(["results", "rich"] as const)("%s transition", (kind) => {
  it("removes the menu at once on close when unset", async () => {
    const { rerender } = await openSearch({ kind });

    await rerender({ active: false });

    expect(menu()).not.toBeInTheDocument();
  });

  it("removes the menu at once on close when false", async () => {
    const { rerender } = await openSearch({ kind, transition: false });

    await rerender({ active: false });

    expect(menu()).not.toBeInTheDocument();
    expect(slide).not.toHaveBeenCalled();
  });

  it("true slides at fast02 and keeps the menu until outroend", async () => {
    const onEvent = vi.fn();
    const { rerender } = await openSearch({
      kind,
      transition: true,
      onEvent,
    });
    expect(slide).toHaveBeenCalled();
    for (const [, params] of vi.mocked(slide).mock.calls) {
      expect(params).toEqual({ duration: "fast02" });
    }
    onEvent.mockClear();

    await rerender({ active: false });
    expect(menu()).toBeInTheDocument();
    await waitFor(() => expect(onEvent).toHaveBeenCalledWith("outrostart"));
    expect(onEvent).not.toHaveBeenCalledWith("outroend");

    await waitFor(() => expect(menu()).not.toBeInTheDocument());
    expect(onEvent).toHaveBeenCalledWith("outroend");
  });

  it("slides with the menu role from Motion", async () => {
    const { rerender } = await openSearch({
      kind,
      motionMenu: { duration: DURATION * 10 },
    });
    expect(slide).toHaveBeenCalled();

    await rerender({ active: false });
    await sleep(DURATION * 4);

    expect(menu()).toBeInTheDocument();
  });

  it("lets its own transition win over Motion", async () => {
    const { rerender } = await openSearch({
      kind,
      motionMenu: true,
      transition: false,
    });

    await rerender({ active: false });

    expect(menu()).not.toBeInTheDocument();
    expect(slide).not.toHaveBeenCalled();
  });

  it("params override the preset", async () => {
    const { rerender } = await openSearch({
      kind,
      transition: { duration: DURATION * 10 },
    });

    await rerender({ active: false });
    await sleep(DURATION * 4);

    expect(menu()).toBeInTheDocument();
    for (const [, params] of vi.mocked(slide).mock.calls) {
      expect(params).toEqual({ duration: DURATION * 10 });
    }
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
    const { rerender } = await openSearch({
      kind,
      transition: { fn: spy, duration: DURATION, delay: 1 },
    });

    await rerender({ active: false });
    await waitFor(() => expect(menu()).not.toBeInTheDocument());

    expect(slide).not.toHaveBeenCalled();
    expect(calls.length).toBeGreaterThan(0);
    for (const params of calls) {
      expect(params).toEqual({ duration: DURATION, delay: 1 });
    }
  });

  it("closes the trigger and is inert while it leaves", async () => {
    const { rerender } = await openSearch({
      kind,
      transition: { duration: DURATION * 10 },
    });
    expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await rerender({ active: false });

    await waitFor(() => expect(menu()?.inert).toBe(true));
    expect(menu()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    if (kind === "rich") {
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    }
  });

  it("is not inert after a reopen reverses the exit", async () => {
    const { rerender } = await openSearch({
      kind,
      transition: { duration: DURATION * 10 },
    });

    await rerender({ active: false });
    await sleep(DURATION);
    await rerender({ active: true });
    await sleep(DURATION * 14);

    expect(menu()).toBeInTheDocument();
    expect(menu()?.inert).toBe(false);
  });

  it("forwards introstart and introend on open", async () => {
    const onEvent = vi.fn();
    const view = render(HeaderSearchTransition, {
      kind,
      transition: { duration: DURATION },
      onEvent,
    });
    await view.rerender({ active: true });

    await waitFor(() => expect(onEvent).toHaveBeenCalledWith("introend"));
    expect(onEvent).toHaveBeenCalledWith("introstart");
    expect(onEvent).not.toHaveBeenCalledWith("outrostart");
  });

  it("removes the menu without waiting under reduced motion", async () => {
    stubReducedMotion(true);
    const onEvent = vi.fn();
    const { rerender } = await openSearch({
      kind,
      transition: { duration: 10_000 },
      onEvent,
    });

    await rerender({ active: false });

    await waitFor(() => expect(menu()).not.toBeInTheDocument(), {
      timeout: 100,
    });
    expect(onEvent).toHaveBeenCalledWith("outroend");
  });

  it("tears down cleanly when unmounted mid-exit", async () => {
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);
    const { rerender, unmount } = await openSearch({
      kind,
      transition: { duration: DURATION * 2 },
    });

    await rerender({ active: false });
    expect(menu()).toBeInTheDocument();

    unmount();
    await sleep(DURATION * 5);
    window.removeEventListener("error", onError);

    expect(menu()).not.toBeInTheDocument();
    expect(errors).toEqual([]);
  });
});

describe("results transition", () => {
  it.each([undefined, true])(
    "selects a result by click with transition %s",
    async (transition) => {
      const onSelect = vi.fn();
      await openSearch({ kind: "results", transition, onSelect });

      screen.getByText("Beta").click();

      await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
      expect(onSelect.mock.calls[0][0].detail.selectedResultIndex).toBe(1);
    },
  );
});
