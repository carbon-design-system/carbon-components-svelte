import { render, screen, waitFor } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { MotionValue } from "../../src/motion/context.js";
import type { TransitionProp } from "../../src/motion/resolve-transition.js";
import { fade, type FadeParams } from "../../src/motion/transitions.js";
import TooltipTransition from "./TooltipTransition.test.svelte";

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const content = (name = "") => screen.queryByTestId(`content${name}`);

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: reduce,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Render the tooltip open, and let a Svelte 5 entrance finish. */
async function openTooltip(props: {
  portalTooltip: boolean;
  transition?: TransitionProp<FadeParams>;
  motionTooltip?: MotionValue;
  onOutroEnd?: (name: string) => void;
}) {
  const view = render(TooltipTransition, { ...props, open: true });
  expect(content()).toBeInTheDocument();
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
] as const)("transition prop %s", (_, portalTooltip) => {
  it("removes the tooltip at once on close when unset", async () => {
    const { rerender } = await openTooltip({ portalTooltip });

    await rerender({ open: false });

    expect(content()).not.toBeInTheDocument();
  });

  it("removes the tooltip at once on close when false", async () => {
    const { rerender } = await openTooltip({
      portalTooltip,
      transition: false,
    });

    await rerender({ open: false });

    expect(content()).not.toBeInTheDocument();
  });

  it("fades out with the tooltip role from Motion", async () => {
    const { rerender } = await openTooltip({
      portalTooltip,
      motionTooltip: { duration: DURATION },
    });

    await rerender({ open: false });
    expect(content()).toBeInTheDocument();
    await waitFor(() => expect(content()).not.toBeInTheDocument());
  });

  it("lets its own transition win over Motion", async () => {
    const { rerender } = await openTooltip({
      portalTooltip,
      motionTooltip: { duration: DURATION },
      transition: false,
    });

    await rerender({ open: false });

    expect(content()).not.toBeInTheDocument();
  });

  it("fades out before removing, then fires outroend", async () => {
    const onOutroEnd = vi.fn();
    const { rerender } = await openTooltip({
      portalTooltip,
      transition: { duration: DURATION },
      onOutroEnd,
    });

    await rerender({ open: false });
    expect(content()).toBeInTheDocument();
    expect(onOutroEnd).not.toHaveBeenCalled();

    await waitFor(() => expect(content()).not.toBeInTheDocument());
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("true fades out before removing", async () => {
    const { rerender } = await openTooltip({ portalTooltip, transition: true });

    await rerender({ open: false });
    expect(content()).toBeInTheDocument();

    await waitFor(() => expect(content()).not.toBeInTheDocument());
  });

  it("accepts a token name for the duration", async () => {
    const { rerender } = await openTooltip({
      portalTooltip,
      transition: { duration: "slow02" },
    });

    await rerender({ open: false });
    await sleep(DURATION * 4);

    expect(content()).toBeInTheDocument();
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
    const { rerender } = await openTooltip({
      portalTooltip,
      transition: { fn: spy, duration: DURATION },
    });

    await rerender({ open: false });
    await waitFor(() => expect(content()).not.toBeInTheDocument());

    expect(calls.length).toBeGreaterThan(0);
    expect(calls.at(-1)).toEqual({ duration: DURATION });
  });

  it("opens again from a half-played exit", async () => {
    const onOutroEnd = vi.fn();
    const { rerender } = await openTooltip({
      portalTooltip,
      transition: { duration: DURATION * 4 },
      onOutroEnd,
    });

    await rerender({ open: false });
    await sleep(DURATION);
    await rerender({ open: true });
    await sleep(DURATION * 8);

    expect(content()).toBeInTheDocument();
    expect(onOutroEnd).not.toHaveBeenCalled();
  });

  it("removes the tooltip without waiting under reduced motion", async () => {
    stubReducedMotion(true);
    const onOutroEnd = vi.fn();
    const { rerender } = await openTooltip({
      portalTooltip,
      transition: { duration: 10_000 },
      onOutroEnd,
    });

    await rerender({ open: false });

    await waitFor(() => expect(content()).not.toBeInTheDocument(), {
      timeout: 100,
    });
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("tears down cleanly when unmounted mid-exit", async () => {
    const onOutroEnd = vi.fn();
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);

    const { rerender, unmount } = await openTooltip({
      portalTooltip,
      transition: { duration: DURATION * 2 },
      onOutroEnd,
    });
    await rerender({ open: false });
    expect(content()).toBeInTheDocument();

    unmount();
    await sleep(DURATION * 5);
    window.removeEventListener("error", onError);

    expect(content()).not.toBeInTheDocument();
    expect(errors).toEqual([]);
  });
});

describe("in a TooltipGroup", () => {
  const trigger = (name: string) => screen.getByRole("button", { name });

  const user = userEvent.setup();

  const hover = (name: string) => user.hover(trigger(name));
  const unhover = (name: string) => user.unhover(trigger(name));

  function renderGroup(duration = DURATION) {
    const onIntroStart = vi.fn();
    const onOutroEnd = vi.fn();
    render(TooltipTransition, {
      kind: "group",
      portalTooltip: false,
      transition: { duration },
      onIntroStart,
      onOutroEnd,
    });
    return { onIntroStart, onOutroEnd };
  }

  it("fades in a tooltip that opens with no neighbor", async () => {
    const { onIntroStart } = renderGroup();

    await hover("A");
    await waitFor(() => expect(content("-a")).toBeInTheDocument());

    await waitFor(() => expect(onIntroStart).toHaveBeenCalledWith("a"));
  });

  it("opens a tooltip with no fade while a neighbor is still open", async () => {
    const { onIntroStart } = renderGroup();
    await hover("A");
    await waitFor(() => expect(content("-a")).toBeInTheDocument());
    await sleep(DURATION * 3);
    onIntroStart.mockClear();

    await unhover("A");
    await hover("B");

    // At once: no enter delay, and no intro.
    expect(content("-b")).toBeInTheDocument();
    await sleep(DURATION * 3);
    expect(onIntroStart).not.toHaveBeenCalled();
    expect(content("-a")).not.toBeInTheDocument();
  });

  it("removes the tooltip handed off from at once, and fires outroend", async () => {
    const { onOutroEnd } = renderGroup(DURATION * 10);
    await hover("A");
    await waitFor(() => expect(content("-a")).toBeInTheDocument());
    await sleep(DURATION * 12);

    await unhover("A");
    await hover("B");

    // Well inside the exit fade, which would take 400ms.
    await waitFor(() => expect(content("-a")).not.toBeInTheDocument(), {
      timeout: 150,
    });
    expect(content("-b")).toBeInTheDocument();
    await waitFor(() => expect(onOutroEnd).toHaveBeenCalledWith("a"));
  });

  it("hides a tooltip already fading out when another takes over", async () => {
    renderGroup(DURATION * 10);
    await hover("A");
    await waitFor(() => expect(content("-a")).toBeInTheDocument());
    await sleep(DURATION * 12);
    await unhover("A");
    // The leave delay passes and the fade starts.
    await sleep(DURATION * 2);
    expect(content("-a")).toBeVisible();

    await hover("B");

    expect(content("-b")).toBeInTheDocument();
    expect(content("-a")).not.toBeVisible();
  });

  it("opens a tooltip with no fade within the skip window after another closed", async () => {
    const { onIntroStart } = renderGroup();
    await hover("A");
    await waitFor(() => expect(content("-a")).toBeInTheDocument());
    await sleep(DURATION * 3);
    await unhover("A");
    await waitFor(() => expect(content("-a")).not.toBeInTheDocument());
    onIntroStart.mockClear();

    await hover("B");

    expect(content("-b")).toBeInTheDocument();
    await sleep(DURATION * 3);
    expect(onIntroStart).not.toHaveBeenCalled();
  });

  it("fades in again once the skip window has passed", async () => {
    const { onIntroStart } = renderGroup();
    await hover("A");
    await waitFor(() => expect(content("-a")).toBeInTheDocument());
    await unhover("A");
    await waitFor(() => expect(content("-a")).not.toBeInTheDocument());
    await sleep(200);
    onIntroStart.mockClear();

    await hover("B");
    await waitFor(() => expect(content("-b")).toBeInTheDocument());

    await waitFor(() => expect(onIntroStart).toHaveBeenCalledWith("b"));
  });

  it("closes the tooltip with no fade after an instant open", async () => {
    const { onOutroEnd } = renderGroup();
    await hover("A");
    await waitFor(() => expect(content("-a")).toBeInTheDocument());
    await unhover("A");
    await waitFor(() => expect(content("-a")).not.toBeInTheDocument());
    await hover("B");
    await sleep(DURATION * 3);
    onOutroEnd.mockClear();

    await unhover("B");
    await waitFor(() => expect(content("-b")).not.toBeInTheDocument());

    expect(onOutroEnd).not.toHaveBeenCalled();
  });
});
