import { rafThrottle } from "../../src/utils/raf-throttle.js";

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

  it("runs fn once per frame when called repeatedly", () => {
    // Queue every request instead of keeping only the latest, so a second
    // request for the same frame is visible (it would run `fn` twice).
    const frames: Array<() => void> = [];
    const raf = vi.fn((cb: () => void) => frames.push(cb));
    vi.stubGlobal("requestAnimationFrame", raf);
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled();
    throttled();
    throttled();

    expect(raf).toHaveBeenCalledTimes(1);
    expect(fn).not.toHaveBeenCalled();
    for (const cb of frames) cb();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("passes the latest arguments to fn", () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled("a");
    throttled("b");
    flushFrame();

    expect(fn).toHaveBeenCalledExactlyOnceWith("b");
  });

  it("can schedule again after the frame runs", () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled();
    flushFrame();
    throttled();
    flushFrame();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("cancel() clears a pending frame", () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled();
    throttled.cancel();

    expect(cancelled).toBe(true);
    flushFrame();
    expect(fn).not.toHaveBeenCalled();
  });

  it("cancel() does nothing when no frame is pending", () => {
    const throttled = rafThrottle(vi.fn());
    expect(() => throttled.cancel()).not.toThrow();
    expect(cancelled).toBe(false);
  });
});
