import { rafThrottle } from "../../src/utils/rafThrottle.js";

describe("rafThrottle", () => {
  let frame: (() => void) | null;
  let cancelled: boolean;

  beforeEach(() => {
    frame = null;
    cancelled = false;
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
      frame = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {
      cancelled = true;
      frame = null;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Run the queued animation frame, if any. */
  function flushFrame() {
    const cb = frame;
    frame = null;
    cb?.();
  }

  test("runs fn once per frame when called repeatedly", () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled();
    throttled();
    throttled();

    expect(fn).not.toHaveBeenCalled();
    flushFrame();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("passes the latest arguments to fn", () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled("a");
    throttled("b");
    flushFrame();

    expect(fn).toHaveBeenCalledExactlyOnceWith("b");
  });

  test("can schedule again after the frame runs", () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled();
    flushFrame();
    throttled();
    flushFrame();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("cancel() clears a pending frame", () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled();
    throttled.cancel();

    expect(cancelled).toBe(true);
    flushFrame();
    expect(fn).not.toHaveBeenCalled();
  });

  test("cancel() does nothing when no frame is pending", () => {
    const throttled = rafThrottle(vi.fn());
    expect(() => throttled.cancel()).not.toThrow();
    expect(cancelled).toBe(false);
  });
});
