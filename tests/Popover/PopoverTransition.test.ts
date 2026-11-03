import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import type { TransitionProp } from "../../src/motion/resolve-transition.js";
import { fade, type FadeParams } from "../../src/motion/transitions.js";
import { rect } from "../utils/rect";
import PopoverPortal from "./PopoverPortal.test.svelte";
import PopoverTransition from "./PopoverTransition.test.svelte";

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const content = () => screen.queryByTestId("content");
const popover = () => document.getElementById("pop");

/** A popover in place stays in the page and shows by its open class. */
const shown = () =>
  document.getElementById("pop")?.classList.contains("bx--popover--open") ??
  false;

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: reduce,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Render the popover open, and let a Svelte 5 entrance finish. */
async function openPopover(props: {
  portalPopover: boolean;
  transition?: TransitionProp<FadeParams>;
  onOutroEnd?: () => void;
}) {
  const view = render(PopoverTransition, props);
  expect(shown()).toBe(true);
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

describe.each([
  ["in place", false],
  ["in a portal", true],
] as const)("transition prop %s", (_, portalPopover) => {
  it("hides at once on close when unset", async () => {
    const { rerender } = await openPopover({ portalPopover });

    await rerender({ open: false });

    expect(shown()).toBe(false);
  });

  it("hides at once on close when false", async () => {
    const { rerender } = await openPopover({
      portalPopover,
      transition: false,
    });

    await rerender({ open: false });

    expect(shown()).toBe(false);
  });

  it("fades out before hiding, then fires outroend", async () => {
    const onOutroEnd = vi.fn();
    const { rerender } = await openPopover({
      portalPopover,
      transition: { duration: DURATION },
      onOutroEnd,
    });

    await rerender({ open: false });
    expect(shown()).toBe(true);
    expect(content()).toBeInTheDocument();
    expect(onOutroEnd).not.toHaveBeenCalled();

    await waitFor(() => expect(shown()).toBe(false));
    expect(content()).not.toBeInTheDocument();
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("true fades out before hiding", async () => {
    const { rerender } = await openPopover({ portalPopover, transition: true });

    await rerender({ open: false });
    expect(shown()).toBe(true);

    await waitFor(() => expect(shown()).toBe(false));
  });

  it("accepts a token name for the duration", async () => {
    const { rerender } = await openPopover({
      portalPopover,
      transition: { duration: "slow02" },
    });

    await rerender({ open: false });
    await sleep(DURATION * 4);

    expect(shown()).toBe(true);
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
    const { rerender } = await openPopover({
      portalPopover,
      transition: { fn: spy, duration: DURATION },
    });

    await rerender({ open: false });
    await waitFor(() => expect(shown()).toBe(false));

    expect(calls.length).toBeGreaterThan(0);
    expect(calls.at(-1)).toEqual({ duration: DURATION });
  });

  it("opens again from a half-played exit", async () => {
    const onOutroEnd = vi.fn();
    const { rerender } = await openPopover({
      portalPopover,
      transition: { duration: DURATION * 4 },
      onOutroEnd,
    });

    await rerender({ open: false });
    await sleep(DURATION);
    await rerender({ open: true });
    await sleep(DURATION * 8);

    expect(shown()).toBe(true);
    expect(content()).toBeInTheDocument();
    expect(onOutroEnd).not.toHaveBeenCalled();
  });

  it("hides without waiting under reduced motion", async () => {
    stubReducedMotion(true);
    const onOutroEnd = vi.fn();
    const { rerender } = await openPopover({
      portalPopover,
      transition: { duration: 10_000 },
      onOutroEnd,
    });

    await rerender({ open: false });

    await waitFor(() => expect(shown()).toBe(false), { timeout: 100 });
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("tears down cleanly when unmounted mid-exit", async () => {
    const onOutroEnd = vi.fn();
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);

    const { rerender, unmount } = await openPopover({
      portalPopover,
      transition: { duration: DURATION * 2 },
      onOutroEnd,
    });
    await rerender({ open: false });
    expect(shown()).toBe(true);

    unmount();
    await sleep(DURATION * 5);
    window.removeEventListener("error", onError);

    expect(document.getElementById("pop")).toBeNull();
    expect(errors).toEqual([]);
  });

  it("keeps the ref on the element in the page", async () => {
    const { rerender } = await openPopover({
      portalPopover,
      transition: { duration: DURATION },
    });
    expect(screen.getByTestId("ref")).toHaveTextContent("pop");

    await rerender({ open: false });
    await waitFor(() => expect(shown()).toBe(false));

    expect(screen.getByTestId("ref")).toHaveTextContent(
      portalPopover ? "none" : "pop",
    );
  });
});

describe("in place", () => {
  it("mounts the contents only while open when animated", async () => {
    const { rerender } = render(PopoverTransition, {
      open: false,
      portalPopover: false,
      transition: true,
    });
    expect(content()).not.toBeInTheDocument();

    await rerender({ open: true });
    expect(content()).toBeInTheDocument();
  });

  it("keeps the contents mounted while closed when not animated", () => {
    render(PopoverTransition, { open: false, portalPopover: false });

    expect(content()).toBeInTheDocument();
    expect(shown()).toBe(false);
  });
});

describe("in a portal", () => {
  it("fires introstart when it opens", async () => {
    const onIntroStart = vi.fn();
    const { rerender } = render(PopoverTransition, {
      open: false,
      portalPopover: true,
      transition: { duration: DURATION },
      onIntroStart,
    });

    await rerender({ open: true });

    await waitFor(() => expect(onIntroStart).toHaveBeenCalledTimes(1));
  });
});

describe("when a box around it would cut it off", () => {
  // The same 1000 x 600 window and 400 x 100 box as PopoverPortal.test.ts.
  beforeEach(() => {
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      1000,
    );
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(
      600,
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        if (this.dataset.testid === "box")
          return rect({ width: 400, height: 100 });
        if (this.id === "pop")
          return rect({ top: 40, width: 200, height: 160 });
        return rect({ width: 40, height: 40 });
      },
    );
  });

  afterEach(() => vi.restoreAllMocks());

  it("moves to a portal, and back in place once it has left", async () => {
    const { rerender } = render(PopoverPortal, {
      props: { open: false, transition: { duration: DURATION } },
    });
    const box = screen.getByTestId("box");
    box.style.overflowX = "hidden";
    box.style.overflowY = "hidden";
    Object.defineProperty(box, "clientWidth", { value: 400 });
    Object.defineProperty(box, "clientHeight", { value: 100 });

    async function cycle() {
      await rerender({ open: true });
      await tick();
      await tick();
      await tick();
      await sleep(DURATION * 3);
      expect(box).not.toContainElement(popover());
      expect(popover()).toHaveClass("bx--popover--portal");

      await rerender({ open: false });
      expect(popover()).toHaveClass("bx--popover--open");

      await waitFor(() =>
        expect(document.querySelectorAll("#pop")).toHaveLength(1),
      );
      expect(screen.getByTestId("anchor")).toContainElement(popover());
      expect(popover()).not.toHaveClass("bx--popover--open");
    }

    // The second open fits from the in-place popover's ref, so it shows
    // the ref survived the first exit.
    await cycle();
    await cycle();
  });
});
