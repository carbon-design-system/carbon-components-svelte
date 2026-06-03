import { createTimeoutDismiss } from "../../src/utils/timeoutDismiss.js";

describe("createTimeoutDismiss", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("fires onTimeout once after the timeout while open", () => {
    const dismiss = createTimeoutDismiss();
    const cb = vi.fn();

    dismiss.sync(true, 1000, cb);
    expect(cb).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test("does not start a timer when timeout is 0", () => {
    const dismiss = createTimeoutDismiss();
    const cb = vi.fn();

    dismiss.sync(true, 0, cb);

    expect(dismiss.timeoutId).toBeUndefined();
    vi.advanceTimersByTime(10000);
    expect(cb).not.toHaveBeenCalled();
  });

  test("does not start a timer when closed", () => {
    const dismiss = createTimeoutDismiss();
    const cb = vi.fn();

    dismiss.sync(false, 1000, cb);

    expect(dismiss.timeoutId).toBeUndefined();
    vi.advanceTimersByTime(1000);
    expect(cb).not.toHaveBeenCalled();
  });

  test("a second sync cancels the first pending timer", () => {
    const dismiss = createTimeoutDismiss();
    const first = vi.fn();
    const second = vi.fn();

    dismiss.sync(true, 1000, first);
    dismiss.sync(true, 1000, second);

    vi.advanceTimersByTime(1000);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test("clear cancels a pending timer", () => {
    const dismiss = createTimeoutDismiss();
    const cb = vi.fn();

    dismiss.sync(true, 1000, cb);
    dismiss.clear();

    expect(dismiss.timeoutId).toBeUndefined();
    vi.advanceTimersByTime(1000);
    expect(cb).not.toHaveBeenCalled();
  });
});
