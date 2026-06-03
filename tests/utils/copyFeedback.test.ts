import { createCopyFeedbackState } from "../../src/utils/copyFeedback.js";

describe("createCopyFeedbackState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("runs performCopy once and starts fade-in feedback", () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    state.onClick(performCopy, 2000);

    expect(performCopy).toHaveBeenCalledTimes(1);
    expect(state.animation).toBe("fade-in");
    expect(state.feedbackOpen).toBe(true);
  });

  test("ignores a second onClick while feedback is active", () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    state.onClick(performCopy, 2000);
    state.onClick(performCopy, 2000);

    expect(performCopy).toHaveBeenCalledTimes(1);
  });

  test("transitions to fade-out after feedbackTimeout", () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    state.onClick(performCopy, 100);
    vi.advanceTimersByTime(100);

    expect(state.animation).toBe("fade-out");
  });

  test("resets on hide-feedback animation end", () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    state.onClick(performCopy, 2000);
    state.onAnimationEnd({ animationName: "hide-feedback" });

    expect(state.animation).toBeUndefined();
    expect(state.feedbackOpen).toBe(false);

    state.onClick(performCopy, 2000);
    expect(performCopy).toHaveBeenCalledTimes(2);
  });

  test("dismiss clears state and allows another copy", () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    state.onClick(performCopy, 2000);
    state.dismiss();

    expect(state.animation).toBeUndefined();
    expect(state.feedbackOpen).toBe(false);

    state.onClick(performCopy, 2000);
    expect(performCopy).toHaveBeenCalledTimes(2);
  });

  test("cleanup clears timeout without calling onSync", () => {
    const onSync = vi.fn();
    const state = createCopyFeedbackState(onSync);

    state.onClick(vi.fn(), 2000);
    onSync.mockClear();

    state.cleanup();

    expect(onSync).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(state.animation).toBeUndefined();
    expect(state.feedbackOpen).toBe(false);
  });
});
