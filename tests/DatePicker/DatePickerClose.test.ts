import { cleanup, render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import DatePickerClose from "./DatePickerClose.test.svelte";

afterEach(() => {
  cleanup();
});

describe("DatePicker close event", () => {
  it('dispatches close with trigger "select" when a date is chosen', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, { props: { onClose } });

    await user.click(screen.getByLabelText("Date"));
    const calendar = await screen.findByLabelText("calendar-container");
    const day = calendar.querySelector<HTMLElement>(
      ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
    );
    if (!day) throw new Error("expected a selectable day");

    await user.click(day);

    expect(calendar).not.toHaveClass("open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("select");
  });

  it('dispatches close with trigger "escape-key" when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, { props: { onClose } });

    const input = screen.getByLabelText("Date");
    await user.click(input);
    const calendar = await screen.findByLabelText("calendar-container");
    expect(calendar).toHaveClass("open");

    input.focus();
    await user.keyboard("{Escape}");
    await tick();

    expect(calendar).not.toHaveClass("open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("escape-key");
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, { props: { onClose } });

    await user.click(screen.getByLabelText("Date"));
    const calendar = await screen.findByLabelText("calendar-container");
    expect(calendar).toHaveClass("open");

    await user.click(document.body);

    expect(calendar).not.toHaveClass("open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("outside-click");
  });

  it('dispatches close with trigger "outside-click" when dismissing without changing an existing value', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, {
      props: { onClose, value: "01/15/1990" },
    });

    await user.click(screen.getByLabelText("Date"));
    const calendar = await screen.findByLabelText("calendar-container");
    expect(calendar).toHaveClass("open");

    await user.click(document.body);

    expect(calendar).not.toHaveClass("open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("outside-click");
  });

  it('dispatches close with trigger "outside-click" when dismissing a range without changing values', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, {
      props: {
        onClose,
        datePickerType: "range",
        valueFrom: "01/01/2025",
        valueTo: "01/31/2025",
      },
    });

    await user.click(screen.getByLabelText("Start date"));
    const calendar = await waitFor(() => {
      const openCalendar = document.querySelector<HTMLElement>(
        ".flatpickr-calendar.open[aria-label='calendar-container']",
      );
      if (!openCalendar) {
        throw new Error("expected an open calendar");
      }
      return openCalendar;
    });

    await user.click(document.body);

    expect(calendar).not.toHaveClass("open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("outside-click");
  });

  it('dispatches close with trigger "outside-click" when dismissing a partial range selection', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, {
      props: {
        onClose,
        datePickerType: "range",
      },
    });

    await user.click(screen.getByLabelText("Start date"));
    const calendar = await waitFor(() => {
      const openCalendar = document.querySelector<HTMLElement>(
        ".flatpickr-calendar.open[aria-label='calendar-container']",
      );
      if (!openCalendar) {
        throw new Error("expected an open calendar");
      }
      return openCalendar;
    });
    const startDay = calendar.querySelector<HTMLElement>(
      '[aria-label="June 1, 2026"]',
    );
    if (!startDay) throw new Error("expected a start day");

    await user.click(startDay);
    await user.click(document.body);
    await tick();

    expect(calendar).not.toHaveClass("open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("outside-click");
  });

  it('dispatches close with trigger "select" when a range is chosen', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, {
      props: {
        onClose,
        datePickerType: "range",
      },
    });

    await user.click(screen.getByLabelText("Start date"));
    const calendar = await waitFor(() => {
      const openCalendar = document.querySelector<HTMLElement>(
        ".flatpickr-calendar.open[aria-label='calendar-container']",
      );
      if (!openCalendar) {
        throw new Error("expected an open calendar");
      }
      return openCalendar;
    });
    const startDay = calendar.querySelector<HTMLElement>(
      '[aria-label="June 1, 2026"]',
    );
    if (!startDay) throw new Error("expected a start day");

    await user.click(startDay);
    await tick();

    const endDay = calendar.querySelector<HTMLElement>(
      '[aria-label="June 15, 2026"]',
    );
    if (!endDay) throw new Error("expected an end day");

    await user.click(endDay);

    await waitFor(() => expect(calendar).not.toHaveClass("open"));
    await tick();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.selectedDates).toHaveLength(2);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("select");
  });

  it('dispatches close with trigger "select" when changing an existing single value', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, {
      props: {
        onClose,
        value: "01/01/2025",
      },
    });

    await user.click(screen.getByLabelText("Date"));
    const calendar = await screen.findByLabelText("calendar-container");
    const day = calendar.querySelector<HTMLElement>(
      ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay):not(.selected)",
    );
    if (!day) throw new Error("expected a selectable day");

    await user.click(day);

    expect(calendar).not.toHaveClass("open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("select");
  });
});
