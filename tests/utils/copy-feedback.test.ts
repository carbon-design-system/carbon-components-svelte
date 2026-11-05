// @vitest-environment node
import { COPY_FEEDBACK_FADE_MS } from "../../src/constants/timing.js";
import { createCopyFeedbackState } from "../../src/utils/copy-feedback.js";

describe("createCopyFeedbackState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("runs performCopy once and starts fade-in feedback", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 2000);

    expect(performCopy).toHaveBeenCalledTimes(1);
    expect(state.animation).toBe("fade-in");
    expect(state.feedbackOpen).toBe(true);
    expect(state.copyPending).toBe(false);
  });

  it("transitions to fade-out after feedbackTimeout", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 100);
    vi.advanceTimersByTime(100);

    expect(state.animation).toBe("fade-out");
  });

  it("closes after the fade when animationend never fires", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 100);
    vi.advanceTimersByTime(100);
    expect(state.animation).toBe("fade-out");
    expect(state.feedbackOpen).toBe(true);

    // A hidden element, or a tooltip without the animation, never fires
    // `animationend`. The fallback closes the feedback and frees the copy.
    vi.advanceTimersByTime(COPY_FEEDBACK_FADE_MS + 50);

    expect(state.feedbackOpen).toBe(false);
    expect(state.animation).toBeUndefined();

    await state.onClick(performCopy, 100);
    expect(performCopy).toHaveBeenCalledTimes(2);
  });

  it("closes at once under reduced motion", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
    }));
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 100);
    vi.advanceTimersByTime(100);

    expect(state.animation).toBeUndefined();
    expect(state.feedbackOpen).toBe(false);

    await state.onClick(performCopy, 100);
    expect(performCopy).toHaveBeenCalledTimes(2);
  });

  it("resets on hide-feedback animation end", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 2000);
    state.onAnimationEnd({ animationName: "hide-feedback" });

    expect(state.animation).toBeUndefined();
    expect(state.feedbackOpen).toBe(false);

    await state.onClick(performCopy, 2000);
    expect(performCopy).toHaveBeenCalledTimes(2);
  });

  it("dismiss clears state and allows another copy", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 2000);
    state.dismiss();

    expect(state.animation).toBeUndefined();
    expect(state.feedbackOpen).toBe(false);

    await state.onClick(performCopy, 2000);
    expect(performCopy).toHaveBeenCalledTimes(2);
  });

  it("cleanup clears timeout without calling onSync", async () => {
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

  it("async performCopy delays feedback until resolved", async () => {
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

  it("rejected performCopy shows error feedback and retries on the next click", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi
      .fn()
      .mockRejectedValueOnce(new Error("copy failed"))
      .mockResolvedValueOnce(undefined);

    await expect(state.onClick(performCopy, 2000)).rejects.toThrow(
      "copy failed",
    );

    expect(state.animation).toBe("fade-in");
    expect(state.feedbackOpen).toBe(true);
    expect(state.isError).toBe(true);
    expect(state.copyPending).toBe(false);

    await state.onClick(performCopy, 2000);

    expect(performCopy).toHaveBeenCalledTimes(2);
    expect(state.animation).toBe("fade-in");
    expect(state.feedbackOpen).toBe(true);
    expect(state.isError).toBe(false);
  });

  it("ignores a click during success feedback, through the fade-out", async () => {
    const state = createCopyFeedbackState();
    const performCopy = vi.fn();

    await state.onClick(performCopy, 100);
    await state.onClick(performCopy, 100);
    vi.advanceTimersByTime(100);
    expect(state.animation).toBe("fade-out");
    await state.onClick(performCopy, 100);
    expect(performCopy).toHaveBeenCalledTimes(1);

    state.onAnimationEnd({ animationName: "hide-feedback" });
    await state.onClick(performCopy, 100);
    expect(performCopy).toHaveBeenCalledTimes(2);
  });

  it("holds error feedback open until a slow retry settles", async () => {
    const state = createCopyFeedbackState();
    let resolveCopy: () => void = () => {};
    const slowCopy = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve;
        }),
    );

    await expect(
      state.onClick(() => Promise.reject(new Error("no")), 100),
    ).rejects.toThrow();
    const retry = state.onClick(slowCopy, 100);

    // A click while the retry is in flight is ignored.
    await state.onClick(slowCopy, 100);
    expect(slowCopy).toHaveBeenCalledTimes(1);

    // Longer than the timeout: the error stays up, with no fade-out.
    vi.advanceTimersByTime(500);
    expect(state.feedbackOpen).toBe(true);
    expect(state.animation).toBe("fade-in");
    expect(state.isError).toBe(true);

    resolveCopy();
    await retry;
    expect(state.isError).toBe(false);
    vi.advanceTimersByTime(99);
    expect(state.animation).toBe("fade-in");
    vi.advanceTimersByTime(1);
    expect(state.animation).toBe("fade-out");
  });
});
