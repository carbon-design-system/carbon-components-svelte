import { render } from "@testing-library/svelte";
import type { Instance } from "flatpickr/dist/types/instance";
import { tick } from "svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";
import { user } from "../utils/user";
import DatePicker from "./DatePicker.test.svelte";
import DatePickerHost from "./DatePickerHost.test.svelte";
import { renderCalendar } from "./flatpickr-instance";
import { openCalendar, preloadFlatpickrPlugins } from "./helpers";

const mountRange = () => renderCalendar({ datePickerType: "range" });

beforeAll(preloadFlatpickrPlugins, 30_000);

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

  // flatpickr registers a `resize` listener of its own, so count what each
  // step adds or removes rather than the absolute total.
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
    expect(calendar).not.toHaveClass("open");

    const closed = netCounts(add, remove);
    expect(closed.scroll).toBe(before.scroll);
    expect(closed.resize).toBe(open.resize - 1);
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
