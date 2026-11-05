import { render, screen, waitFor } from "@testing-library/svelte";
import HoverCardTransition from "./HoverCardTransition.test.svelte";

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const body = () => screen.queryByTestId("body");

beforeEach(() => {
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("HoverCard transition prop", () => {
  it("removes the card at once on close when unset", async () => {
    const { rerender } = render(HoverCardTransition, { open: true });
    expect(body()).toBeInTheDocument();

    await rerender({ open: false });

    expect(body()).not.toBeInTheDocument();
  });

  it("keeps the card until its exit has played, then fires outroend", async () => {
    const onOutroEnd = vi.fn();
    const { rerender } = render(HoverCardTransition, {
      open: false,
      transition: { duration: DURATION },
      onOutroEnd,
    });
    await rerender({ open: true });
    // An animated popover opens a flush after it mounts.
    await waitFor(() => expect(body()).toBeInTheDocument());
    await sleep(DURATION * 4);

    await rerender({ open: false });
    expect(body()).toBeInTheDocument();
    expect(onOutroEnd).not.toHaveBeenCalled();

    await waitFor(() => expect(body()).not.toBeInTheDocument());
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });
});
