import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import type { CalendarInstance as Instance } from "../../src/DatePicker/calendar";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";
import { user } from "../utils/user";
import DatePicker from "./DatePicker.test.svelte";
import DatePickerHost from "./DatePickerHost.test.svelte";
import { renderCalendar } from "./calendar-instance";
import { openCalendar } from "./helpers";

const mountRange = () => renderCalendar({ datePickerType: "range" });

const openCalendarInstance = async (): Promise<Instance> => {
  const { instance } = await renderCalendar({ datePickerType: "single" });
  instance.open();
  await tick();
  return instance;
};

describe("DatePicker window listeners", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("leaves no window or document listeners behind after 30 pickers", async () => {
    /** Live registrations on window and document, by event type and handler. */
    const live = new Map<string, Map<unknown, number>>();
    for (const target of [window, document]) {
      const { addEventListener, removeEventListener } = target;
      vi.spyOn(target, "addEventListener").mockImplementation(function (
        this: EventTarget,
        ...args: Parameters<EventTarget["addEventListener"]>
      ) {
        const byHandler = live.get(args[0]) ?? new Map();
        byHandler.set(args[1], (byHandler.get(args[1]) ?? 0) + 1);
        live.set(args[0], byHandler);
        return Reflect.apply(addEventListener, this, args);
      });
      vi.spyOn(target, "removeEventListener").mockImplementation(function (
        this: EventTarget,
        ...args: Parameters<EventTarget["removeEventListener"]>
      ) {
        // Removing a listener that was never added is a no-op.
        const byHandler = live.get(args[0]);
        const count = byHandler?.get(args[1]) ?? 0;
        if (count > 0) byHandler?.set(args[1], count - 1);
        return Reflect.apply(removeEventListener, this, args);
      });
    }
    const outstanding = () =>
      Object.fromEntries(
        [...live]
          .map(([type, byHandler]) => [
            type,
            [...byHandler.values()].reduce((sum, count) => sum + count, 0),
          ])
          .filter(([, count]) => count),
      );
    const cycle = async (index: number) => {
      const { instance, unmount } = await renderCalendar({
        datePickerType: ["single", "range", "multiple"][index % 3] as
          "single" | "range" | "multiple",
      });
      instance.open();
      await tick();
      instance.close();
      unmount();
      await tick();
    };

    // The first picker may set up shared listeners Svelte keeps for the page.
    await cycle(0);
    const baseline = outstanding();
    for (let index = 1; index <= 30; index++) {
      // biome-ignore lint/performance/noAwaitInLoops: each picker mounts, opens, closes, and unmounts before the next
      await cycle(index);
    }

    expect(outstanding()).toEqual(baseline);
  }, 30_000);

  it("closed date pickers register no click listeners", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const N = 5;
    for (let i = 0; i < N; i++) {
      render(DatePicker, { props: { datePickerType: "single" } });
    }
    await tick();

    expect(netListenerCalls(add, remove, "click")).toBe(0);
  });

  it("an open calendar registers one shared click listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const instance = await openCalendarInstance();
    await flushDismiss();
    expect(instance.isOpen).toBe(true);
    expect(netListenerCalls(add, remove, "click")).toBe(1);
  });

  it("closing the calendar removes the click listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const instance = await openCalendarInstance();
    await flushDismiss();
    expect(netListenerCalls(add, remove, "click")).toBe(1);

    instance.close();
    await tick();
    expect(instance.isOpen).toBe(false);
    expect(netListenerCalls(add, remove, "click")).toBe(0);
  });
});

describe("DatePicker fixed-position reposition listeners", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const spyOnWindow = () => ({
    add: vi.spyOn(window, "addEventListener"),
    remove: vi.spyOn(window, "removeEventListener"),
  });

  // Count what each step adds or removes rather than the absolute total.
  const netCounts = (
    add: ReturnType<typeof vi.spyOn>,
    remove: ReturnType<typeof vi.spyOn>,
  ) => ({
    scroll: netListenerCalls(add, remove, "scroll"),
    resize: netListenerCalls(add, remove, "resize"),
  });

  it("removes the scroll and resize listeners when the calendar closes", async () => {
    const { add, remove } = spyOnWindow();
    render(DatePickerHost);
    await tick();
    const before = netCounts(add, remove);

    const calendar = await openCalendar();
    const open = netCounts(add, remove);
    expect(open.scroll).toBe(before.scroll + 1);
    expect(open.resize).toBeGreaterThan(before.resize);

    await user.click(document.body);
    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");

    const closed = netCounts(add, remove);
    expect(closed.scroll).toBe(before.scroll);
    expect(closed.resize).toBe(before.resize);
  });

  it("removes the scroll and resize listeners when unmounted while open", async () => {
    const { add, remove } = spyOnWindow();
    const { unmount } = render(DatePickerHost);
    await tick();
    const before = netCounts(add, remove);

    await openCalendar();
    expect(netCounts(add, remove).scroll).toBe(before.scroll + 1);

    unmount();

    const after = netCounts(add, remove);
    expect(after.scroll).toBe(before.scroll);
    expect(after.resize).toBeLessThanOrEqual(before.resize);
  });
});

describe("DatePicker range ignoredFocusElements", () => {
  it("does not share the array with other instances", async () => {
    const first = await mountRange();
    const firstElements = first.instance.config.ignoredFocusElements;
    expect(firstElements).toHaveLength(1);
    first.unmount();

    // flatpickr's range plugin pushes its second input into this array. A
    // default array shared across instances keeps every unmounted range
    // picker's input (and the detached tree it sits in) reachable forever.
    const second = await mountRange();
    const secondElements = second.instance.config.ignoredFocusElements;

    expect(secondElements).not.toBe(firstElements);
    expect(secondElements).toHaveLength(1);
    expect(secondElements).not.toContain(firstElements[0]);
  });
});
