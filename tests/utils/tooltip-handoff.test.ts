// @vitest-environment node
import { get, writable } from "svelte/store";
import { createTooltipHandoff } from "../../src/utils/tooltip-handoff.js";

describe("createTooltipHandoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("scheduleEnter() calls onShow and claims after enterDelayMs", () => {
    const activeTooltip = writable(null);
    const handoff = createTooltipHandoff({
      activeTooltip,
      getId: () => "a",
      enterDelayMs: 100,
      leaveDelayMs: 300,
    });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(99);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(get(activeTooltip)).toBe("a");
  });

  it("scheduleEnter() skips the delay on warm handoff from another id", () => {
    const activeTooltip = writable("other");
    const handoff = createTooltipHandoff({
      activeTooltip,
      getId: () => "a",
      enterDelayMs: 100,
      leaveDelayMs: 300,
    });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(get(activeTooltip)).toBe("a");
  });

  it("scheduleEnter() does not warm-handoff when the store is empty", () => {
    const activeTooltip = writable(null);
    const handoff = createTooltipHandoff({
      activeTooltip,
      getId: () => "a",
      enterDelayMs: 100,
      leaveDelayMs: 300,
    });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it("scheduleEnter() does not warm-handoff when the store already holds this id", () => {
    const activeTooltip = writable("a");
    const handoff = createTooltipHandoff({
      activeTooltip,
      getId: () => "a",
      enterDelayMs: 100,
      leaveDelayMs: 300,
    });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it("scheduleLeave() calls onHide after leaveDelayMs", () => {
    const activeTooltip = writable("a");
    const handoff = createTooltipHandoff({
      activeTooltip,
      getId: () => "a",
      enterDelayMs: 100,
      leaveDelayMs: 300,
    });
    const onHide = vi.fn();

    handoff.scheduleLeave(onHide);
    expect(onHide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(299);
    expect(onHide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("scheduleLeave() cancels a pending scheduleEnter()", () => {
    const activeTooltip = writable(null);
    const handoff = createTooltipHandoff({
      activeTooltip,
      getId: () => "a",
      enterDelayMs: 100,
      leaveDelayMs: 300,
    });
    const onShow = vi.fn();
    const onHide = vi.fn();

    handoff.scheduleEnter(onShow);
    handoff.scheduleLeave(onHide);
    vi.advanceTimersByTime(300);
    expect(onShow).not.toHaveBeenCalled();
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("claim() sets the store unconditionally", () => {
    const activeTooltip = writable(null);
    const handoff = createTooltipHandoff({ activeTooltip, getId: () => "a" });

    handoff.claim();
    expect(get(activeTooltip)).toBe("a");
  });

  it("release() clears the store only when this id still holds it", () => {
    const activeTooltip = writable("a");
    const handoff = createTooltipHandoff({ activeTooltip, getId: () => "a" });

    handoff.release();
    expect(get(activeTooltip)).toBe(null);
  });

  it("release() is a no-op when another id holds the store", () => {
    const activeTooltip = writable("other");
    const handoff = createTooltipHandoff({ activeTooltip, getId: () => "a" });

    handoff.release();
    expect(get(activeTooltip)).toBe("other");
  });

  it("reads the current id on each call", () => {
    const activeTooltip = writable(null);
    let id = "a";
    const handoff = createTooltipHandoff({ activeTooltip, getId: () => id });

    handoff.claim();
    expect(get(activeTooltip)).toBe("a");
    id = "b";
    handoff.release();
    expect(get(activeTooltip)).toBe("a");
    handoff.claim();
    handoff.release();
    expect(get(activeTooltip)).toBe(null);
  });

  it("cancel() discards a pending scheduleEnter() without claiming", () => {
    const activeTooltip = writable(null);
    const handoff = createTooltipHandoff({
      activeTooltip,
      getId: () => "a",
      enterDelayMs: 100,
    });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    handoff.cancel();
    vi.advanceTimersByTime(100);
    expect(onShow).not.toHaveBeenCalled();
    expect(get(activeTooltip)).toBe(null);
  });

  it("default enterDelayMs/leaveDelayMs match the shared timing constants", () => {
    const activeTooltip = writable(null);
    const handoff = createTooltipHandoff({ activeTooltip, getId: () => "a" });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    vi.advanceTimersByTime(99);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onShow).toHaveBeenCalledTimes(1);

    const onHide = vi.fn();
    handoff.scheduleLeave(onHide);
    vi.advanceTimersByTime(299);
    expect(onHide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onHide).toHaveBeenCalledTimes(1);
  });
});
