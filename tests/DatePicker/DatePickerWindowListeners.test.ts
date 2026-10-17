import { render } from "@testing-library/svelte";
import type { Instance } from "flatpickr/dist/types/instance";
import { tick } from "svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";
import { user } from "../utils/user";
import DatePicker from "./DatePicker.test.svelte";
import { renderCalendar } from "./flatpickr-instance";
import { openCalendar } from "./helpers";

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

  it("a click inside the calendar does not dismiss it", async () => {
    render(DatePicker, { props: { datePickerType: "single" } });

    const calendar = await openCalendar();
    expect(calendar).toHaveClass("open");

    // Month nav doesn't pick a date; it shouldn't close the calendar.
    const inside =
      calendar.querySelector<HTMLElement>(".flatpickr-months") ?? calendar;
    await user.click(inside);
    expect(calendar).toHaveClass("open");
  });
});
