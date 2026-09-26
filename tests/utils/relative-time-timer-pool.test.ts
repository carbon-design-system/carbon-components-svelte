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
  describe("visibilitychange", () => {
    function setHidden(hidden: boolean) {
      Object.defineProperty(document, "hidden", {
        value: hidden,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    }

    afterEach(() => {
      setHidden(false);
    });

    it("pauses while hidden, resyncs immediately on visible, then keeps ticking", () => {
      const cb = vi.fn();
      const unsubscribe = subscribeRelativeTimeTick(1000, cb);

      setHidden(true);
      vi.advanceTimersByTime(5000);
      expect(cb).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);

      setHidden(false);
      expect(cb).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(cb).toHaveBeenCalledTimes(2);

      unsubscribe();
    });

    it("starts paused when already hidden at subscribe time, then resyncs on first visible", () => {
      setHidden(true);
      const cb = vi.fn();
      const unsubscribe = subscribeRelativeTimeTick(1000, cb);

      expect(vi.getTimerCount()).toBe(0);
      expect(cb).not.toHaveBeenCalled();

      setHidden(false);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(1);

      unsubscribe();
    });

    it("resyncs every cadence's consumers independently", () => {
      const second = vi.fn();
      const minute = vi.fn();
      const unsubscribeSecond = subscribeRelativeTimeTick(1000, second);
      const unsubscribeMinute = subscribeRelativeTimeTick(60_000, minute);

      setHidden(true);
      setHidden(false);

      expect(second).toHaveBeenCalledTimes(1);
      expect(minute).toHaveBeenCalledTimes(1);

      unsubscribeSecond();
      unsubscribeMinute();
    });

    it("does not stack intervals on a redundant visible event", () => {
      const cb = vi.fn();
      const unsubscribe = subscribeRelativeTimeTick(1000, cb);

      setHidden(false);
      expect(vi.getTimerCount()).toBe(1);

      unsubscribe();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("cleans up correctly when the last consumer unsubscribes while hidden", () => {
      const cb = vi.fn();
      const unsubscribe = subscribeRelativeTimeTick(1000, cb);
      setHidden(true);
      unsubscribe();
      expect(() => setHidden(false)).not.toThrow();
      expect(vi.getTimerCount()).toBe(0);
    });

    describe("listener lifecycle", () => {
      let add: ReturnType<typeof vi.spyOn>;
      let remove: ReturnType<typeof vi.spyOn>;
      const count = (spy: { mock: { calls: unknown[][] } }) =>
        spy.mock.calls.filter(([type]) => type === "visibilitychange").length;

      beforeEach(() => {
        add = vi.spyOn(document, "addEventListener");
        remove = vi.spyOn(document, "removeEventListener");
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it("adds one shared listener across multiple cadences and removes it once the last bucket unsubscribes", () => {
        const unsubscribeA = subscribeRelativeTimeTick(1000, vi.fn());
        const unsubscribeB = subscribeRelativeTimeTick(60_000, vi.fn());
        expect(count(add)).toBe(1);

        unsubscribeA();
        expect(count(remove)).toBe(0);

        unsubscribeB();
        expect(count(remove)).toBe(1);
      });
    });
  });
});
