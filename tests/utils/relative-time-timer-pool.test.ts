// @vitest-environment node
import { subscribeRelativeTimeTick } from "../../src/utils/relative-time-timer-pool.js";

describe("subscribeRelativeTimeTick", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shares one timer across subscribers at the same cadence", () => {
    const a = vi.fn();
    const b = vi.fn();

    const unsubscribeA = subscribeRelativeTimeTick(1000, a);
    const unsubscribeB = subscribeRelativeTimeTick(1000, b);

    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unsubscribeA();
    expect(vi.getTimerCount()).toBe(1);

    unsubscribeB();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps distinct cadences on separate timers", () => {
    const second = vi.fn();
    const minute = vi.fn();

    const unsubscribeSecond = subscribeRelativeTimeTick(1000, second);
    const unsubscribeMinute = subscribeRelativeTimeTick(60_000, minute);

    expect(vi.getTimerCount()).toBe(2);

    vi.advanceTimersByTime(1000);
    expect(second).toHaveBeenCalledTimes(1);
    expect(minute).toHaveBeenCalledTimes(0);

    unsubscribeSecond();
    unsubscribeMinute();
    expect(vi.getTimerCount()).toBe(0);
  });
});
