import { get } from "svelte/store";
import {
  activeTooltip,
  createTooltipGroup,
} from "../../src/utils/tooltip-group.js";
import { createTooltipHandoff } from "../../src/utils/tooltip-handoff.js";

describe("createTooltipHandoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    activeTooltip.set(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const group = () =>
    createTooltipGroup({
      enterDelayMs: () => 100,
      leaveDelayMs: () => 300,
      skipDelayMs: () => 300,
    });

  it("scheduleEnter() calls onShow and claims after the enter delay", () => {
    const handoff = createTooltipHandoff({ group: group() });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    vi.advanceTimersByTime(99);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(get(handoff.active)).toBe(true);
    expect(get(handoff.instant)).toBe(false);
  });

  it("skips the delay and opens instantly while a tooltip in the same group is shown", () => {
    const shared = group();
    const a = createTooltipHandoff({ group: shared });
    const b = createTooltipHandoff({ group: shared });
    const onShow = vi.fn();

    a.claim();
    b.scheduleEnter(onShow);
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(get(b.active)).toBe(true);
    expect(get(b.instant)).toBe(true);
    expect(get(a.active)).toBe(false);
    expect(get(a.hidden)).toBe(true);
  });

  it("does not skip the delay while a tooltip in another group is shown", () => {
    const a = createTooltipHandoff({ group: group() });
    const b = createTooltipHandoff({ group: group() });
    const onShow = vi.fn();

    a.claim();
    b.scheduleEnter(onShow);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(get(b.instant)).toBe(false);
    expect(get(a.hidden)).toBe(true);
  });

  it("opens instantly within the skip window after a group tooltip closes", () => {
    const shared = group();
    const a = createTooltipHandoff({ group: shared });
    const b = createTooltipHandoff({ group: shared });

    a.claim();
    a.release();
    vi.advanceTimersByTime(299);
    b.claim();
    expect(get(b.instant)).toBe(true);
  });

  it("opens with the delay once the skip window has passed", () => {
    const shared = group();
    const a = createTooltipHandoff({ group: shared });
    const b = createTooltipHandoff({ group: shared });
    const onShow = vi.fn();

    a.claim();
    a.release();
    vi.advanceTimersByTime(300);
    b.scheduleEnter(onShow);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(get(b.instant)).toBe(false);
  });

  it("does not skip the delay when this tooltip already holds the slot", () => {
    const handoff = createTooltipHandoff({ group: group() });
    const onShow = vi.fn();

    handoff.claim();
    handoff.scheduleEnter(onShow);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it("a nested group shares its parent's handoff scope", () => {
    const parent = group();
    const a = createTooltipHandoff({ group: parent });
    const b = createTooltipHandoff({ group: createTooltipGroup({ parent }) });

    a.claim();
    b.claim();
    expect(get(b.instant)).toBe(true);
  });

  it("a member delay overrides the group delay", () => {
    const handoff = createTooltipHandoff({
      group: group(),
      enterDelayMs: () => 500,
      leaveDelayMs: () => undefined,
    });
    const onShow = vi.fn();
    const onHide = vi.fn();

    handoff.scheduleEnter(onShow);
    vi.advanceTimersByTime(499);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onShow).toHaveBeenCalledTimes(1);

    handoff.scheduleLeave(onHide);
    vi.advanceTimersByTime(300);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("scheduleLeave() cancels a pending scheduleEnter()", () => {
    const handoff = createTooltipHandoff({ group: group() });
    const onShow = vi.fn();
    const onHide = vi.fn();

    handoff.scheduleEnter(onShow);
    handoff.scheduleLeave(onHide);
    vi.advanceTimersByTime(300);
    expect(onShow).not.toHaveBeenCalled();
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("release() is a no-op when another tooltip holds the slot", () => {
    const a = createTooltipHandoff({ group: group() });
    const b = createTooltipHandoff({ group: group() });

    b.claim();
    a.release();
    expect(get(b.active)).toBe(true);
  });

  it("instant clears when the tooltip loses the slot", () => {
    const shared = group();
    const a = createTooltipHandoff({ group: shared });
    const b = createTooltipHandoff({ group: shared });
    const c = createTooltipHandoff({ group: group() });

    a.claim();
    b.claim();
    expect(get(b.instant)).toBe(true);
    c.claim();
    expect(get(b.instant)).toBe(false);
  });

  it("cancel() discards a pending scheduleEnter() without claiming", () => {
    const handoff = createTooltipHandoff({ group: group() });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    handoff.cancel();
    vi.advanceTimersByTime(100);
    expect(onShow).not.toHaveBeenCalled();
    expect(get(activeTooltip)).toBe(null);
  });

  it("defaults to the shared timing constants", () => {
    const handoff = createTooltipHandoff({ group: createTooltipGroup() });
    const onShow = vi.fn();

    handoff.scheduleEnter(onShow);
    vi.advanceTimersByTime(99);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onShow).toHaveBeenCalledTimes(1);

    // An icon label hides at once.
    const onHide = vi.fn();
    handoff.scheduleLeave(onHide);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("a hoverable tooltip lingers for the shared leave delay", () => {
    const handoff = createTooltipHandoff({
      group: createTooltipGroup(),
      hoverable: true,
    });
    const onHide = vi.fn();

    handoff.scheduleLeave(onHide);
    vi.advanceTimersByTime(299);
    expect(onHide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("a group's leave delay applies to icon labels and hoverable tooltips", () => {
    const shared = createTooltipGroup({ leaveDelayMs: () => 50 });
    const icon = createTooltipHandoff({ group: shared });
    const hoverable = createTooltipHandoff({ group: shared, hoverable: true });
    const onHide = vi.fn();

    icon.scheduleLeave(onHide);
    hoverable.scheduleLeave(onHide);
    vi.advanceTimersByTime(49);
    expect(onHide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onHide).toHaveBeenCalledTimes(2);
  });
});
