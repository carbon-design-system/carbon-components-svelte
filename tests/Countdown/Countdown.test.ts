import { act, render, screen } from "@testing-library/svelte";
import Countdown from "./Countdown.test.svelte";
import CountdownSentence from "./CountdownSentence.test.svelte";
import CountdownUnbound from "./CountdownUnbound.test.svelte";

const timer = () => screen.getByRole("timer");
const advance = async (ms: number) => {
  await act(() => vi.advanceTimersByTime(ms));
};

describe("Countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down in m:ss", async () => {
    render(Countdown);
    expect(timer()).toHaveTextContent("1:30");

    await advance(3000);

    expect(timer()).toHaveTextContent("1:27");
  });

  it.each([
    [3725, "auto", "1:02:05"],
    [300, "mm:ss", "05:00"],
    [300, "h:mm:ss", "0:05:00"],
    [3725, "m:ss", "62:05"],
    [3725, "mm:ss", "62:05"],
  ] as const)("formats %i s with %s as %s", (seconds, format, text) => {
    render(Countdown, { seconds, format });

    expect(timer()).toHaveTextContent(text);
  });

  it("pauses while running is false", async () => {
    const { rerender } = render(Countdown);

    await rerender({ running: false });
    await advance(5000);

    expect(timer()).toHaveTextContent("1:30");
  });

  it("restarts from a remaining value set from outside", async () => {
    const { rerender } = render(Countdown, { seconds: 30 });
    await advance(10_000);
    expect(timer()).toHaveTextContent("0:20");

    await rerender({ remaining: 620 });
    expect(timer()).toHaveTextContent("10:20");
    await advance(2000);

    expect(timer()).toHaveTextContent("10:18");
  });

  it("announces one minute left and the end, and dispatches end", async () => {
    const { component, container } = render(Countdown, { seconds: 62 });
    const live = container.querySelector("[aria-live]");
    expect(live).toHaveTextContent("");

    await advance(2000);
    expect(live).toHaveTextContent("One minute left");

    await advance(60_000);
    expect(timer()).toHaveTextContent("0:00");
    expect(live).toHaveTextContent("Time is up");
    expect(component.ends).toBe(1);
    expect(component.running).toBe(false);
  });

  it.each([
    [
      "an expired until at mount",
      () => ({ until: Date.now() - 5000 }),
      undefined,
      "",
    ],
    ["seconds of 0 at mount", () => ({ seconds: 0 }), undefined, ""],
    [
      "until moved into the past",
      () => ({ until: Date.now() + 60_000 }),
      () => ({ until: Date.now() - 5000 }),
      "Time is up",
    ],
  ])("ends once for %s", async (_, initial, change, announced) => {
    const { component, container, rerender } = render(
      CountdownUnbound,
      initial(),
    );
    if (change) await rerender(change());

    await advance(2000);

    expect(timer()).toHaveTextContent("0:00");
    expect(component.ends).toBe(1);
    expect(component.running).toBe(false);
    expect(container.querySelector("[aria-live]")).toHaveTextContent(announced);
  });

  it("resumes from the paused value and pauses again", async () => {
    const { component, rerender } = render(Countdown);
    await advance(10_000);
    await rerender({ running: false });
    await advance(5000);
    expect(timer()).toHaveTextContent("1:20");

    await rerender({ running: true });
    await advance(2000);

    expect(timer()).toHaveTextContent("1:18");
    expect(component.running).toBe(true);

    await rerender({ running: false });
    await advance(5000);

    expect(timer()).toHaveTextContent("1:18");
  });

  it("announces the warning again after time is added above warnAt", async () => {
    const { container, rerender } = render(Countdown, { seconds: 62 });
    const live = container.querySelector("[aria-live]");
    await advance(2000);
    expect(live).toHaveTextContent("One minute left");

    await rerender({ remaining: 300 });

    expect(live).toHaveTextContent("");
  });

  it("clears its interval on unmount", () => {
    const { unmount } = render(Countdown);
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("rewrites the time when format changes", async () => {
    const { rerender } = render(Countdown, { seconds: 300 });

    await rerender({ format: "mm:ss" });

    expect(timer()).toHaveTextContent("05:00");
  });

  it("restarts when time is added after it ran out", async () => {
    const { component, rerender } = render(Countdown, { seconds: 5 });
    await advance(6000);
    expect(component.ends).toBe(1);

    await rerender({ remaining: 60 });
    await advance(2000);

    expect(timer()).toHaveTextContent("0:58");
    expect(component.running).toBe(true);
  });

  it("catches up when a background tab is shown again", async () => {
    render(Countdown);

    // A hidden tab barely runs timers, but the clock moves on.
    vi.setSystemTime(Date.now() + 30_000);
    await act(() => document.dispatchEvent(new Event("visibilitychange")));

    expect(timer()).toHaveTextContent("1:00");
  });

  it("counts down to an absolute time with until", async () => {
    // `seconds` defaults to 60, so only `until` can make this read 0:30.
    const { rerender } = render(CountdownUnbound, {
      until: Date.now() + 30_000,
    });
    expect(timer()).toHaveTextContent("0:30");

    await rerender({ until: Date.now() + 300_000 });

    expect(timer()).toHaveTextContent("5:00");
  });

  it("warns warnAt seconds before the end", async () => {
    const { container } = render(Countdown, {
      seconds: 125,
      warnAt: 120,
      warnDescription: "Two minutes left",
    });

    await advance(6000);

    expect(container.querySelector("[aria-live]")).toHaveTextContent(
      "Two minutes left",
    );
  });

  it("passes the time and the share left to a slot", async () => {
    render(Countdown, { seconds: 100, withSlot: true });

    await advance(25_000);

    expect(screen.getByTestId("custom")).toHaveTextContent("1:15 0.75");
  });

  it("adds no whitespace around the time, for a countdown in a sentence", () => {
    render(CountdownSentence);

    expect(screen.getByTestId("sentence").textContent).toBe("Held for 2:05.");
  });
});
