import { get, writable } from "svelte/store";
import { createTooltipHandoff } from "../../src/utils/tooltip-handoff.js";

describe("createTooltipHandoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("scheduleEnter() calls onShow and claims after enterDelayMs", () => {
    const activeTooltip = writable(null);
    const handoff = createTooltipHandoff({
      activeTooltip,
      id: "a",
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

  test("scheduleEnter() skips the delay on warm handoff from another id", () => {
    const activeTooltip = writable("other");
    const handoff = createTooltipHandoff({
      activeTooltip,
      id: "a",
      enterDelayMs: 100,
      leaveDelayMs: 300,
    });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(get(activeTooltip)).toBe("a");
  });

  test("scheduleEnter() does not warm-handoff when the store is empty", () => {
    const activeTooltip = writable(null);
    const handoff = createTooltipHandoff({
      activeTooltip,
      id: "a",
      enterDelayMs: 100,
      leaveDelayMs: 300,
    });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  test("scheduleEnter() does not warm-handoff when the store already holds this id", () => {
    const activeTooltip = writable("a");
    const handoff = createTooltipHandoff({
      activeTooltip,
      id: "a",
      enterDelayMs: 100,
      leaveDelayMs: 300,
    });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  test("scheduleLeave() calls onHide after leaveDelayMs", () => {
    const activeTooltip = writable("a");
    const handoff = createTooltipHandoff({
      activeTooltip,
      id: "a",
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

  test("scheduleLeave() cancels a pending scheduleEnter()", () => {
    const activeTooltip = writable(null);
    const handoff = createTooltipHandoff({
      activeTooltip,
      id: "a",
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

  test("claim() sets the store unconditionally", () => {
    const activeTooltip = writable(null);
    const handoff = createTooltipHandoff({ activeTooltip, id: "a" });

    handoff.claim();
    expect(get(activeTooltip)).toBe("a");
  });

  test("release() clears the store only when this id still holds it", () => {
    const activeTooltip = writable("a");
    const handoff = createTooltipHandoff({ activeTooltip, id: "a" });

    handoff.release();
    expect(get(activeTooltip)).toBe(null);
  });

  test("release() is a no-op when another id holds the store", () => {
    const activeTooltip = writable("other");
    const handoff = createTooltipHandoff({ activeTooltip, id: "a" });

    handoff.release();
    expect(get(activeTooltip)).toBe("other");
  });

  test("release() uses a custom emptyValue", () => {
    const activeTooltip = writable("a");
    const handoff = createTooltipHandoff({
      activeTooltip,
      id: "a",
      emptyValue: "none",
    });

    handoff.release();
    expect(get(activeTooltip)).toBe("none");
  });

  test("release() honors an explicit `emptyValue: undefined`", () => {
    const activeTooltip = writable("a");
    const handoff = createTooltipHandoff({
      activeTooltip,
      id: "a",
      emptyValue: undefined,
    });

    handoff.release();
    expect(get(activeTooltip)).toBe(undefined);
  });

  test("cancel() discards a pending scheduleEnter() without claiming", () => {
    const activeTooltip = writable(null);
    const handoff = createTooltipHandoff({
      activeTooltip,
      id: "a",
      enterDelayMs: 100,
    });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    handoff.cancel();
    vi.advanceTimersByTime(100);
    expect(onShow).not.toHaveBeenCalled();
    expect(get(activeTooltip)).toBe(null);
  });

  test("default enterDelayMs/leaveDelayMs match the shared timing constants", () => {
    const activeTooltip = writable(null);
    const handoff = createTooltipHandoff({ activeTooltip, id: "a" });
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
