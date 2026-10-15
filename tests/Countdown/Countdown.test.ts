import { act, render, screen } from "@testing-library/svelte";
import Countdown from "./Countdown.test.svelte";

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

  it("passes the time and the share left to a slot", async () => {
    render(Countdown, { seconds: 100, withSlot: true });

    await advance(25_000);

    expect(screen.getByTestId("custom")).toHaveTextContent("1:15 0.75");
  });
});
