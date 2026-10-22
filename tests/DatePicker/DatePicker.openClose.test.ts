import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { getBoundText } from "../utils/get-bound-text";
import { user } from "../utils/user";
import DatePicker from "./DatePicker.test.svelte";
import DatePickerClose from "./DatePickerClose.test.svelte";
import DatePickerOpen from "./DatePickerOpen.test.svelte";
import {
  dayByLabel,
  findDay,
  firstDay,
  getDays,
  openCalendar,
} from "./helpers";

const getBoundOpen = () => getBoundText("open");
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
    const calendar = await screen.findByLabelText(/^Choose a /);

    await waitFor(() =>
      expect(calendar).toHaveClass("bx--date-picker__calendar--open"),
    );
    expect(onopen).toHaveBeenCalledTimes(1);
  });

  it("opens and closes through the prop, reporting a programmatic close", async () => {
    const onopen = vi.fn();
    const onclose = vi.fn();
    const { rerender } = render(DatePickerOpen, { props: { onopen, onclose } });
    const calendar = await screen.findByLabelText(/^Choose a /);

    await rerender({ open: true });
    expect(calendar).toHaveClass("bx--date-picker__calendar--open");
    expect(onopen).toHaveBeenCalledTimes(1);

    await rerender({ open: false });
    await settle();
    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail.trigger).toBe("programmatic");
  });

  it("follows the user opening and dismissing the calendar", async () => {
    const onclose = vi.fn();
    render(DatePickerOpen, { props: { onclose } });
    const input = screen.getByLabelText("Date");
    await screen.findByLabelText(/^Choose a /);

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
    const calendar = await openCalendar();

    await user.click(firstDay(calendar));
    await settle();

    expect(getBoundOpen()).toBe("false");
    expect(onclose.mock.calls[0][0].detail.trigger).toBe("select");
  });

  it("reports the selection in the open event", async () => {
    const onopen = vi.fn();
    render(DatePickerOpen, { props: { value: "01/15/2024", onopen } });

    await openCalendar();

    const { selectedDates, dateStr } = onopen.mock.calls[0][0].detail;
    expect(dateStr).toBe("01/15/2024");
    expect(selectedDates).toEqual([new Date(2024, 0, 15)]);
  });

  it("is ignored in simple mode", async () => {
    const { rerender } = render(DatePickerOpen, {
      props: { datePickerType: "simple" },
    });
    await rerender({ open: true });
    expect(screen.queryByLabelText(/^Choose a /)).toBeNull();
  });

  it("does not open a read-only picker", async () => {
    render(DatePickerOpen, { props: { open: true, readonly: true } });
    const calendar = await screen.findByLabelText(/^Choose a /);
    await settle();
    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
  });
});

/** Opens the range picker's start input and returns the open calendar. */
async function openRangeCalendar() {
  await screen.findByLabelText(/^Choose a /);
  await user.click(screen.getByLabelText("Start date"));
  return waitFor(() => {
    const calendar = document.querySelector<HTMLElement>(
      ".bx--date-picker__calendar.bx--date-picker__calendar--open[role=dialog]",
    );
    assert(calendar, "expected an open calendar");
    return calendar;
  });
}

describe("DatePicker close event", () => {
  it('dispatches close with trigger "select" when a date is chosen', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, { props: { onClose } });

    const calendar = await openCalendar();
    await user.click(firstDay(calendar));

    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("select");
  });

  it('dispatches close with trigger "escape-key" when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, { props: { onClose } });

    const input = screen.getByLabelText("Date");
    const calendar = await openCalendar();
    expect(calendar).toHaveClass("bx--date-picker__calendar--open");

    input.focus();
    await user.keyboard("{Escape}");
    await tick();

    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("escape-key");
  });

  it('dispatches close with trigger "escape-key" when Escape is pressed while portalled', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, { props: { onClose, portalMenu: true } });

    const input = screen.getByLabelText("Date");
    const calendar = await openCalendar();
    expect(calendar).toHaveClass("bx--date-picker__calendar--open");
    expect(document.body.contains(calendar)).toBe(true);

    input.focus();
    await user.keyboard("{Escape}");
    await tick();

    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("escape-key");
  });

  it.each([
    { key: "Escape", isComposing: true },
    { key: "Escape", keyCode: 229 },
  ])(
    "keeps the calendar open when Escape cancels an IME composition (%o)",
    async (init) => {
      const onClose = vi.fn();
      render(DatePickerClose, { props: { onClose } });

      const input = screen.getByLabelText("Date");
      const calendar = await openCalendar();

      input.focus();
      await fireEvent.keyDown(input, init);
      await settle();

      expect(calendar).toHaveClass("bx--date-picker__calendar--open");
      expect(onClose).not.toHaveBeenCalled();
    },
  );

  // A browser's Escape carries `keyCode`, which flatpickr's grid handler
  // switches on. user-event's `{Escape}` does not, so fire it by hand.
  async function pressEscapeInGrid() {
    assert(document.activeElement instanceof HTMLElement);
    await fireEvent.keyDown(document.activeElement, {
      key: "Escape",
      keyCode: 27,
    });
    await tick();
    await Promise.resolve();
  }

  it.each([
    ["in place", false],
    ["portalled", true],
  ])(
    'dispatches close with trigger "escape-key" when Escape is pressed in the grid (%s)',
    async (_, portalMenu) => {
      const onClose = vi.fn();
      render(DatePickerClose, { props: { onClose, portalMenu } });

      const input = screen.getByLabelText("Date");
      const calendar = await openCalendar();
      expect(calendar.parentElement === document.body).toBe(portalMenu);
      await user.keyboard("{ArrowDown}");
      expect(calendar.contains(document.activeElement)).toBe(true);

      await pressEscapeInGrid();

      expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose.mock.calls[0][0].detail.trigger).toBe("escape-key");
      expect(input).toHaveFocus();
    },
  );

  it('reports "select" after an earlier Escape from the grid', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, { props: { onClose } });

    const input = screen.getByLabelText("Date");
    const calendar = await openCalendar();
    await user.keyboard("{ArrowDown}");
    await pressEscapeInGrid();

    await user.click(document.body);
    await user.click(input);
    await waitFor(() =>
      expect(calendar).toHaveClass("bx--date-picker__calendar--open"),
    );
    await user.click(firstDay(calendar));

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onClose.mock.calls[1][0].detail.trigger).toBe("select");
  });

  it("reopens the calendar when ArrowDown is pressed after Escape closed it", async () => {
    const onClose = vi.fn();
    render(DatePickerClose, { props: { onClose } });

    const input = screen.getByLabelText("Date");
    const calendar = await openCalendar();
    expect(calendar).toHaveClass("bx--date-picker__calendar--open");

    input.focus();
    await user.keyboard("{Escape}");
    await tick();
    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");

    input.focus();
    await user.keyboard("{ArrowDown}");
    await tick();

    expect(calendar).toHaveClass("bx--date-picker__calendar--open");
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, { props: { onClose } });

    const calendar = await openCalendar();
    expect(calendar).toHaveClass("bx--date-picker__calendar--open");

    await user.click(document.body);

    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("outside-click");
  });

  it('dispatches close with trigger "outside-click" when focus leaves for an outside element', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, { props: { onClose, outsideButton: true } });

    const calendar = await openCalendar();
    // Only the input's blur: flatpickr's own document focus handler never
    // sees this, so the picker's blur handling has to close it.
    await fireEvent.blur(screen.getByLabelText("Date"), {
      relatedTarget: screen.getByRole("button", { name: "Outside" }),
    });
    await settle();

    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("outside-click");
  });

  it("keeps the calendar open when focus moves between range inputs", async () => {
    const onClose = vi.fn();
    render(DatePickerClose, {
      props: { onClose, datePickerType: "range" },
    });

    const calendar = await openRangeCalendar();
    await user.tab();
    expect(screen.getByLabelText("End date")).toHaveFocus();
    await settle();

    expect(calendar).toHaveClass("bx--date-picker__calendar--open");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps the calendar open when the window loses focus", async () => {
    const onClose = vi.fn();
    render(DatePickerClose, { props: { onClose } });

    const calendar = await openCalendar();
    // Leaving the document gives the blur no `relatedTarget`.
    await fireEvent.blur(screen.getByLabelText("Date"));
    await settle();

    expect(calendar).toHaveClass("bx--date-picker__calendar--open");
    expect(onClose).not.toHaveBeenCalled();
  });

  it('dispatches close with trigger "outside-click" when dismissing a partial range selection', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, {
      props: {
        onClose,
        datePickerType: "range",
      },
    });

    const calendar = await openRangeCalendar();

    await user.click(dayByLabel(calendar, 1));
    await user.click(document.body);
    await tick();

    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
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

    const calendar = await openRangeCalendar();

    await user.click(dayByLabel(calendar, 1));
    await tick();

    await user.click(dayByLabel(calendar, 15));

    await waitFor(() =>
      expect(calendar).not.toHaveClass("bx--date-picker__calendar--open"),
    );
    await tick();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.selectedDates).toHaveLength(2);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("select");
  });

  it("reports the chosen date in the close event dateStr", async () => {
    const onClose = vi.fn();
    render(DatePickerClose, { props: { onClose, value: "01/01/2025" } });

    const calendar = await openCalendar();
    await user.click(findDay(calendar, "15"));

    expect(onClose.mock.calls[0][0].detail.dateStr).toBe("01/15/2025");
  });

  it('dispatches close with trigger "select" when changing an existing single value', async () => {
    const onClose = vi.fn();
    render(DatePickerClose, {
      props: {
        onClose,
        value: "01/01/2025",
      },
    });

    const calendar = await openCalendar();
    const day = getDays(calendar).find(
      (node) => !node.classList.contains("bx--date-picker__day--selected"),
    );
    assert(day);

    await user.click(day);

    expect(calendar).not.toHaveClass("bx--date-picker__calendar--open");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail.trigger).toBe("select");
  });
});

describe("DatePicker click inside the calendar", () => {
  it("a click inside the calendar does not dismiss it", async () => {
    render(DatePicker, { props: { datePickerType: "single" } });

    const calendar = await openCalendar();
    expect(calendar).toHaveClass("bx--date-picker__calendar--open");

    // Month nav doesn't pick a date; it shouldn't close the calendar.
    const inside =
      calendar.querySelector<HTMLElement>(".bx--date-picker__month-nav") ??
      calendar;
    await user.click(inside);
    expect(calendar).toHaveClass("bx--date-picker__calendar--open");
  });
});
