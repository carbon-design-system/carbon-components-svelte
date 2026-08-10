import { createDelayedSetter } from "../../src/utils/delayedSetter.js";

describe("createDelayedSetter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("runs fn synchronously when delay is 0", () => {
    const schedule = createDelayedSetter();
    const fn = vi.fn();
    schedule(0, fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("runs fn synchronously when delay is negative", () => {
    const schedule = createDelayedSetter();
    const fn = vi.fn();
    schedule(-1, fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("delays fn until the given delay elapses", () => {
    const schedule = createDelayedSetter();
    const fn = vi.fn();
    schedule(100, fn);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("a later call cancels an earlier pending call", () => {
    const schedule = createDelayedSetter();
    const first = vi.fn();
    const second = vi.fn();
    schedule(100, first);
    schedule(100, second);
    vi.advanceTimersByTime(100);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test("cancel() prevents a pending call from running", () => {
    const schedule = createDelayedSetter();
    const fn = vi.fn();
    schedule(100, fn);
    schedule.cancel();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});
