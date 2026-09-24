import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import DatePickerOpen from "./DatePickerOpen.test.svelte";

const getBoundOpen = () => screen.getByTestId("open").textContent;
/** `close` is dispatched from a microtask. */
const settle = async () => {
  await tick();
  await Promise.resolve();
  await tick();
};

describe("DatePicker bind:open", () => {
  it("opens once the calendar exists when rendered with open", async () => {
    const onopen = vi.fn();
    render(DatePickerOpen, { props: { open: true, onopen } });
    const calendar = await screen.findByLabelText("calendar-container");

    await waitFor(() => expect(calendar).toHaveClass("open"));
    expect(onopen).toHaveBeenCalledTimes(1);
  });

  it("opens and closes through the prop, reporting a programmatic close", async () => {
    const onopen = vi.fn();
    const onclose = vi.fn();
    const { rerender } = render(DatePickerOpen, { props: { onopen, onclose } });
    const calendar = await screen.findByLabelText("calendar-container");

    await rerender({ open: true });
    expect(calendar).toHaveClass("open");
    expect(onopen).toHaveBeenCalledTimes(1);

    await rerender({ open: false });
    await settle();
    expect(calendar).not.toHaveClass("open");
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail.trigger).toBe("programmatic");
  });

  it("follows the user opening and dismissing the calendar", async () => {
    const onclose = vi.fn();
    render(DatePickerOpen, { props: { onclose } });
    const input = screen.getByLabelText("Date");
    await screen.findByLabelText("calendar-container");

    await user.click(input);
    expect(getBoundOpen()).toBe("true");

    input.focus();
    await user.keyboard("{Escape}");
    await settle();
    expect(getBoundOpen()).toBe("false");
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail.trigger).toBe("escape-key");
  });

  it("becomes false after picking a day", async () => {
    const onclose = vi.fn();
    render(DatePickerOpen, { props: { onclose } });
    await user.click(screen.getByLabelText("Date"));
    const calendar = await screen.findByLabelText("calendar-container");
    const day = calendar.querySelector<HTMLElement>(
      ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
    );
    if (!day) throw new Error("expected a selectable day");

    await user.click(day);
    await settle();

    expect(getBoundOpen()).toBe("false");
    expect(onclose.mock.calls[0][0].detail.trigger).toBe("select");
  });

  it("is ignored in simple mode", async () => {
    render(DatePickerOpen, { props: { datePickerType: "simple", open: true } });
    await tick();
    expect(screen.queryByLabelText("calendar-container")).toBeNull();
  });

  it("does not open a read-only picker", async () => {
    render(DatePickerOpen, { props: { open: true, readonly: true } });
    const calendar = await screen.findByLabelText("calendar-container");
    await settle();
    expect(calendar).not.toHaveClass("open");
  });
});
