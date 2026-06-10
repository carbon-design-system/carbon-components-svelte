import { render, screen } from "@testing-library/svelte";
import type { Instance } from "flatpickr/dist/types/instance";
import { tick } from "svelte";
import { user } from "../utils/user";
import DatePicker from "./DatePicker.test.svelte";
import DatePickerCalendar from "./DatePickerCalendar.test.svelte";

const net = (
  add: ReturnType<typeof vi.spyOn>,
  remove: ReturnType<typeof vi.spyOn>,
  type: string,
) =>
  add.mock.calls.filter((c: unknown[]) => c[0] === type).length -
  remove.mock.calls.filter((c: unknown[]) => c[0] === type).length;

const openCalendar = async (oncalendar: () => void): Promise<Instance> => {
  let captured: Instance | null = null;
  render(DatePickerCalendar, {
    props: {
      datePickerType: "single",
      oncalendar: (cal: Instance | null | undefined) => {
        captured = cal ?? null;
        oncalendar();
      },
    },
  });

  const instance = await vi.waitFor(() => {
    if (!captured) throw new Error("calendar not set");
    return captured as Instance;
  });

  instance.open();
  await tick();
  return instance;
};

describe("DatePicker window listeners", () => {
  test("closed date pickers register no click listeners", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const N = 5;
    for (let i = 0; i < N; i++) {
      render(DatePicker, { props: { datePickerType: "single" } });
    }
    await tick();

    expect(net(add, remove, "click")).toBe(0);

    add.mockRestore();
    remove.mockRestore();
  });

  test("an open calendar registers one shared click listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const instance = await openCalendar(() => {});
    expect(instance.isOpen).toBe(true);
    expect(net(add, remove, "click")).toBe(1);

    add.mockRestore();
    remove.mockRestore();
  });

  test("closing the calendar removes the click listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const instance = await openCalendar(() => {});
    expect(net(add, remove, "click")).toBe(1);

    instance.close();
    await tick();
    expect(instance.isOpen).toBe(false);
    expect(net(add, remove, "click")).toBe(0);

    add.mockRestore();
    remove.mockRestore();
  });

  test("an outside click dismisses an open calendar", async () => {
    render(DatePicker, { props: { datePickerType: "single" } });

    const input = screen.getByLabelText("Date");
    await user.click(input);
    const calendar = await screen.findByLabelText("calendar-container");
    expect(calendar).toHaveClass("open");

    await user.click(document.body);
    expect(calendar).not.toHaveClass("open");
  });

  test("a click inside the calendar does not dismiss it", async () => {
    render(DatePicker, { props: { datePickerType: "single" } });

    const input = screen.getByLabelText("Date");
    await user.click(input);
    const calendar = await screen.findByLabelText("calendar-container");
    expect(calendar).toHaveClass("open");

    // Month nav doesn't pick a date; it shouldn't close the calendar.
    const inside =
      calendar.querySelector<HTMLElement>(".flatpickr-months") ?? calendar;
    await user.click(inside);
    expect(calendar).toHaveClass("open");
  });
});
