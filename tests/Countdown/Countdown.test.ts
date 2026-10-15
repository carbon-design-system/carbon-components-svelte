import { act, render, screen } from "@testing-library/svelte";
import Countdown from "./Countdown.test.svelte";
import CountdownSentence from "./CountdownSentence.test.svelte";

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

  it("writes an hour or more as h:mm:ss", () => {
    render(Countdown, { seconds: 3725 });

    expect(timer()).toHaveTextContent("1:02:05");
  });

  it("pads the minutes with mm:ss", () => {
    render(Countdown, { seconds: 300, format: "mm:ss" });

    expect(timer()).toHaveTextContent("05:00");
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
    const { rerender } = render(Countdown, { until: Date.now() + 90_000 });
    expect(timer()).toHaveTextContent("1:30");

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
