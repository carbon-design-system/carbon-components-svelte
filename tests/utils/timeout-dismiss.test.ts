import { createTimeoutDismiss } from "../../src/utils/timeout-dismiss.js";

describe("createTimeoutDismiss", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires onTimeout once after the timeout while open", () => {
    const dismiss = createTimeoutDismiss();
    const cb = vi.fn();

    dismiss.sync(true, 1000, cb);
    expect(cb).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does not start a timer when timeout is 0", () => {
    const dismiss = createTimeoutDismiss();
    const cb = vi.fn();

    dismiss.sync(true, 0, cb);

    expect(dismiss.timeoutId).toBeUndefined();
    vi.advanceTimersByTime(10000);
    expect(cb).not.toHaveBeenCalled();
  });

  it("does not start a timer when closed", () => {
    const dismiss = createTimeoutDismiss();
    const cb = vi.fn();

    dismiss.sync(false, 1000, cb);

    expect(dismiss.timeoutId).toBeUndefined();
    vi.advanceTimersByTime(1000);
    expect(cb).not.toHaveBeenCalled();
  });

  it("a second sync cancels the first pending timer", () => {
    const dismiss = createTimeoutDismiss();
    const first = vi.fn();
    const second = vi.fn();

    dismiss.sync(true, 1000, first);
    dismiss.sync(true, 1000, second);

    vi.advanceTimersByTime(1000);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("clear cancels a pending timer", () => {
    const dismiss = createTimeoutDismiss();
    const cb = vi.fn();

    dismiss.sync(true, 1000, cb);
    dismiss.clear();

    expect(dismiss.timeoutId).toBeUndefined();
    vi.advanceTimersByTime(1000);
    expect(cb).not.toHaveBeenCalled();
  });

  it("pause stops the timer and resume continues with remaining time", () => {
    const dismiss = createTimeoutDismiss();
    const cb = vi.fn();

    dismiss.sync(true, 1000, cb);
    vi.advanceTimersByTime(400);
    dismiss.pause();

    expect(dismiss.timeoutId).toBeUndefined();
    vi.advanceTimersByTime(1000);
    expect(cb).not.toHaveBeenCalled();

    dismiss.resume();
    vi.advanceTimersByTime(599);
    expect(cb).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("pause is a no-op when no timer is active", () => {
    const dismiss = createTimeoutDismiss();
    const cb = vi.fn();

    dismiss.sync(true, 0, cb);
    dismiss.pause();
    dismiss.resume();

    vi.advanceTimersByTime(1000);
    expect(cb).not.toHaveBeenCalled();
  });

  it("resume fires immediately when remaining time is already zero", () => {
    const dismiss = createTimeoutDismiss();
    const cb = vi.fn();

    dismiss.sync(true, 1000, cb);
    vi.setSystemTime(Date.now() + 1000);
    dismiss.pause();
    expect(dismiss.timeoutId).toBeUndefined();

    dismiss.resume();
    expect(cb).toHaveBeenCalledTimes(1);
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

    it("pauses while the document is hidden and resumes when visible", () => {
      const dismiss = createTimeoutDismiss();
      const cb = vi.fn();

      dismiss.sync(true, 1000, cb);
      setHidden(true);
      vi.advanceTimersByTime(1000);
      expect(cb).not.toHaveBeenCalled();

      setHidden(false);
      vi.advanceTimersByTime(1000);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("does not resume on visible when the caller already paused", () => {
      const dismiss = createTimeoutDismiss();
      const cb = vi.fn();

      dismiss.sync(true, 1000, cb);
      dismiss.pause();
      setHidden(true);
      setHidden(false);
      vi.advanceTimersByTime(1000);
      expect(cb).not.toHaveBeenCalled();

      dismiss.resume();
      vi.advanceTimersByTime(1000);
      expect(cb).toHaveBeenCalledTimes(1);
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

      it("does not listen when timeout is 0", () => {
        createTimeoutDismiss().sync(true, 0, vi.fn());
        expect(count(add)).toBe(0);
      });

      it("does not listen when closed", () => {
        createTimeoutDismiss().sync(false, 1000, vi.fn());
        expect(count(add)).toBe(0);
      });

      it("listens once while a timer is active", () => {
        const dismiss = createTimeoutDismiss();
        const cb = vi.fn();

        dismiss.sync(true, 1000, cb);
        dismiss.sync(true, 1000, cb);
        expect(count(add)).toBe(1);
      });

      it("stops listening when the timer fires", () => {
        const dismiss = createTimeoutDismiss();
        const cb = vi.fn();

        dismiss.sync(true, 1000, cb);
        vi.advanceTimersByTime(1000);
        expect(cb).toHaveBeenCalledTimes(1);
        expect(count(remove)).toBe(1);

        dismiss.clear();
        expect(count(remove)).toBe(1);
      });

      it("stops listening when re-synced without a timeout", () => {
        const dismiss = createTimeoutDismiss();
        const cb = vi.fn();

        dismiss.sync(true, 1000, cb);
        dismiss.sync(true, 0, cb);
        expect(count(add)).toBe(1);
        expect(count(remove)).toBe(1);
      });
    });

    it("clear while hidden removes the listener", () => {
      const dismiss = createTimeoutDismiss();
      const cb = vi.fn();

      dismiss.sync(true, 1000, cb);
      setHidden(true);
      dismiss.clear();
      setHidden(false);

      vi.advanceTimersByTime(1000);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  it("remainingMs counts down while running and freezes while paused", () => {
    const dismiss = createTimeoutDismiss();

    expect(dismiss.remainingMs()).toBe(0);

    dismiss.sync(true, 1000, vi.fn());
    expect(dismiss.remainingMs()).toBe(1000);

    vi.advanceTimersByTime(300);
    expect(dismiss.remainingMs()).toBe(700);

    dismiss.pause();
    vi.advanceTimersByTime(500);
    expect(dismiss.remainingMs()).toBe(700);

    dismiss.resume();
    vi.advanceTimersByTime(200);
    expect(dismiss.remainingMs()).toBe(500);

    dismiss.clear();
    expect(dismiss.remainingMs()).toBe(0);
  });

  it("onChange fires on start, pause, resume, and stop, and running follows", () => {
    const onChange = vi.fn();
    const dismiss = createTimeoutDismiss(onChange);

    dismiss.sync(true, 1000, vi.fn());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(dismiss.running).toBe(true);

    dismiss.pause();
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(dismiss.running).toBe(false);

    dismiss.resume();
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(dismiss.running).toBe(true);

    vi.advanceTimersByTime(400);
    expect(onChange).toHaveBeenCalledTimes(3);

    dismiss.clear();
    expect(onChange).toHaveBeenCalledTimes(4);
    expect(dismiss.running).toBe(false);
  });
});
