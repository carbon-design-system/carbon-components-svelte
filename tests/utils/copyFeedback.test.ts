import { createCopyFeedbackState } from "../../src/utils/copyFeedback.js";

describe("createCopyFeedbackState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("runs performCopy once and starts fade-in feedback", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 2000);

    expect(performCopy).toHaveBeenCalledTimes(1);
    expect(state.animation).toBe("fade-in");
    expect(state.feedbackOpen).toBe(true);
    expect(state.copyPending).toBe(false);
  });

  test("ignores a second onClick while feedback is active", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 2000);
    await state.onClick(performCopy, 2000);

    expect(performCopy).toHaveBeenCalledTimes(1);
  });

  test("transitions to fade-out after feedbackTimeout", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 100);
    vi.advanceTimersByTime(100);

    expect(state.animation).toBe("fade-out");
  });

  test("portalled closes feedback directly after feedbackTimeout", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 100, true);
    expect(state.feedbackOpen).toBe(true);

    vi.advanceTimersByTime(100);

    // No hide-feedback animationend fires when portalled, so the timeout must
    // close the tooltip itself.
    expect(state.feedbackOpen).toBe(false);
    expect(state.animation).toBeUndefined();

    // copyActive is also cleared, so a subsequent copy works.
    await state.onClick(performCopy, 100, true);
    expect(performCopy).toHaveBeenCalledTimes(2);
  });

  test("resets on hide-feedback animation end", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 2000);
    state.onAnimationEnd({ animationName: "hide-feedback" });

    expect(state.animation).toBeUndefined();
    expect(state.feedbackOpen).toBe(false);

    await state.onClick(performCopy, 2000);
    expect(performCopy).toHaveBeenCalledTimes(2);
  });

  test("dismiss clears state and allows another copy", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 2000);
    state.dismiss();

    expect(state.animation).toBeUndefined();
    expect(state.feedbackOpen).toBe(false);

    await state.onClick(performCopy, 2000);
    expect(performCopy).toHaveBeenCalledTimes(2);
  });

  test("cleanup clears timeout without calling onSync", async () => {
    const onSync = vi.fn();
    const state = createCopyFeedbackState(onSync);

    await state.onClick(vi.fn(), 2000);
    onSync.mockClear();

    state.cleanup();

    expect(onSync).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(state.animation).toBeUndefined();
    expect(state.feedbackOpen).toBe(false);
  });

  test("async performCopy delays feedback until resolved", async () => {
    const state = createCopyFeedbackState();
    let resolveCopy: () => void = () => {};
    const performCopy = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve;
        }),
    );

    const pending = state.onClick(performCopy, 2000);

    expect(performCopy).toHaveBeenCalledTimes(1);
    expect(state.copyPending).toBe(true);
    expect(state.animation).toBeUndefined();
    expect(state.feedbackOpen).toBe(false);

    resolveCopy();
    await pending;

    expect(state.copyPending).toBe(false);
    expect(state.animation).toBe("fade-in");
    expect(state.feedbackOpen).toBe(true);
  });

  test("rejected performCopy resets state and allows retry", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi
      .fn()
      .mockRejectedValueOnce(new Error("copy failed"))
      .mockResolvedValueOnce(undefined);

    await expect(state.onClick(performCopy, 2000)).rejects.toThrow(
      "copy failed",
    );

    expect(state.animation).toBeUndefined();
    expect(state.feedbackOpen).toBe(false);
    expect(state.copyPending).toBe(false);

    await state.onClick(performCopy, 2000);

    expect(performCopy).toHaveBeenCalledTimes(2);
    expect(state.animation).toBe("fade-in");
  });
});
