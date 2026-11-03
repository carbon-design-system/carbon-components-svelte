import { render, screen, waitFor } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import type * as TransitionsModule from "../../src/motion/transitions.js";
import { fade, fly } from "../../src/motion/transitions.js";
import { user } from "../utils/user";
import ToastNotificationTransition from "./ToastNotificationTransition.test.svelte";

vi.mock("../../src/motion/transitions.js", async (importOriginal) => {
  const original = await importOriginal<typeof TransitionsModule>();
  return { ...original, fly: vi.fn(original.fly) };
});

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const target = () => document.querySelector(".bx--toast-notification");

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: reduce,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Render the notification, and let a Svelte 5 entrance finish. */
async function renderOpen(
  props: Partial<ComponentProps<ToastNotificationTransition>> = {},
) {
  const view = render(ToastNotificationTransition, props);
  expect(target()).toBeInTheDocument();
  await sleep(DURATION * 4);
  return view;
}

beforeEach(() => {
  vi.mocked(fly).mockClear();
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe.each([
  ["a parent {#if}", { show: false }],
  ["the open prop", { open: false }],
] as const)("transition prop when %s closes it", (_, close) => {
  it("removes the notification at once when unset", async () => {
    const { rerender } = await renderOpen();

    await rerender(close);

    expect(target()).not.toBeInTheDocument();
  });

  it("removes the notification at once when false", async () => {
    const { rerender } = await renderOpen({ transition: false });

    await rerender(close);

    expect(target()).not.toBeInTheDocument();
    expect(fly).not.toHaveBeenCalled();
  });

  it("true flys it out and removes it on outroend", async () => {
    const onOutroEnd = vi.fn();
    const { rerender } = await renderOpen({ transition: true, onOutroEnd });

    await rerender(close);
    expect(target()).toBeInTheDocument();
    expect(onOutroEnd).not.toHaveBeenCalled();

    await waitFor(() => expect(target()).not.toBeInTheDocument());
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
    expect(fly).toHaveBeenCalled();
    expect(vi.mocked(fly).mock.calls[0]?.[1]).toEqual({
      x: 32,
      collapse: true,
    });
  });

  it("params override the preset", async () => {
    const { rerender } = await renderOpen({
      transition: { duration: DURATION * 10, x: -32 },
    });

    await rerender(close);
    await sleep(DURATION * 4);

    expect(target()).toBeInTheDocument();
    expect(vi.mocked(fly).mock.calls[0]?.[1]).toEqual({
      x: -32,
      collapse: true,
      duration: DURATION * 10,
    });
  });

  it("fn swaps the transition without the preset", async () => {
    const calls: Record<string, unknown>[] = [];
    const spy = (
      node: Element,
      params: Record<string, unknown>,
      options: { direction: "in" | "out" | "both" },
    ) => {
      calls.push(params);
      return fade(node, params, options);
    };
    const { rerender } = await renderOpen({
      transition: { fn: spy, duration: DURATION },
    });

    await rerender(close);
    await waitFor(() => expect(target()).not.toBeInTheDocument());

    expect(calls.length).toBeGreaterThan(0);
    expect(calls.at(-1)).toEqual({ duration: DURATION });
    expect(fly).not.toHaveBeenCalled();
  });

  it("removes it without waiting under reduced motion", async () => {
    stubReducedMotion(true);
    const onOutroEnd = vi.fn();
    const { rerender } = await renderOpen({
      transition: { duration: 10_000 },
      onOutroEnd,
    });

    await rerender(close);

    await waitFor(() => expect(target()).not.toBeInTheDocument(), {
      timeout: 100,
    });
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("tears down cleanly when unmounted mid-exit", async () => {
    const onOutroEnd = vi.fn();
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);

    const { rerender, unmount } = await renderOpen({
      transition: { duration: DURATION * 2 },
      onOutroEnd,
    });
    await rerender(close);
    expect(target()).toBeInTheDocument();

    unmount();
    await sleep(DURATION * 5);
    window.removeEventListener("error", onError);

    expect(target()).not.toBeInTheDocument();
    expect(errors).toEqual([]);
  });
});

describe("with a transition", () => {
  it("keeps the title, subtitle, caption, slots and close button", async () => {
    await renderOpen({ transition: true });

    expect(screen.getByText("Deployed")).toBeInTheDocument();
    expect(screen.getByText("Build 42 is live.")).toBeInTheDocument();
    expect(screen.getByText("Just now")).toBeInTheDocument();
    expect(screen.getByText("More detail")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
  });

  it("closes from the close button, then leaves on outroend", async () => {
    const onClose = vi.fn();
    const onOutroEnd = vi.fn();
    await renderOpen({ transition: true, onClose, onOutroEnd });

    await user.click(
      screen.getByRole("button", { name: "Close notification" }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(target()).toBeInTheDocument();

    await waitFor(() => expect(target()).not.toBeInTheDocument());
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("leaves when the parent removes it on close", async () => {
    const onOutroEnd = vi.fn();
    await renderOpen({ transition: true, hideOnClose: true, onOutroEnd });

    await user.click(
      screen.getByRole("button", { name: "Close notification" }),
    );

    // The notification also closes itself, which must not strand its element.
    await waitFor(() => expect(target()).not.toBeInTheDocument());
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });
});
