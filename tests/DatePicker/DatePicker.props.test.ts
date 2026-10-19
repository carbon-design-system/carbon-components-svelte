import { render, screen } from "@testing-library/svelte";
import DatePickerProps from "./DatePickerProps.test.svelte";

const engineOf = (input: Element) =>
  (
    input as unknown as {
      _flatpickr: {
        config: Record<string, unknown>;
        isOpen: boolean;
        redraw: () => void;
      };
    }
  )._flatpickr;

type Api = {
  open: () => void;
  showMonth: (date: Date) => void;
  isOpen: boolean;
  view: Date;
  selectedDates: ReadonlyArray<Date>;
};

async function apiOf(component: unknown) {
  const read = () => (component as { calendar: Api | null }).calendar;
  await vi.waitFor(() => expect(read()).toBeTruthy());
  return read() as Api;
}

describe("DatePicker props for calendar options", () => {
  it("applies a prop change without rebuilding the calendar", async () => {
    const { rerender } = render(DatePickerProps, { value: "03/15/2024" });
    const input = screen.getByLabelText("Date");
    await vi.waitFor(() => expect(engineOf(input)).toBeTruthy());
    const engine = engineOf(input);
    const redraw = vi.spyOn(engine, "redraw");

    await rerender({ value: "03/15/2024", closeOnSelect: false });

    expect(engine.config.closeOnSelect).toBe(false);
    expect(redraw).not.toHaveBeenCalled();
  });

  it("maps a deprecated flatpickrProps key to its prop, and warns once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(DatePickerProps, {
      flatpickrProps: { static: true, showMonths: 2 },
    });
    const input = screen.getByLabelText("Date");
    await vi.waitFor(() => expect(engineOf(input)).toBeTruthy());

    expect(engineOf(input).config.showMonths).toBe(2);
    expect(
      warn.mock.calls.filter(([message]) =>
        String(message).includes("`months` prop"),
      ),
    ).toHaveLength(1);
    warn.mockRestore();
  });

  it("makes the field read-only when allowInput turns off after mount", async () => {
    const { rerender } = render(DatePickerProps, {});
    const input = screen.getByLabelText("Date");
    await vi.waitFor(() => expect(engineOf(input)).toBeTruthy());
    expect(input).not.toHaveAttribute("readonly");

    await rerender({ allowInput: false });
    expect(input).toHaveAttribute("readonly");
  });

  it("adds dayDescription to a day's label", async () => {
    const { component } = render(DatePickerProps, {
      value: "03/15/2024",
      dayDescription: (date: Date) =>
        date.getDate() === 15 ? "2 events" : undefined,
    });
    const calendar = await apiOf(component);
    calendar.open();

    expect(
      screen.getByLabelText("Friday, March 15, 2024, 2 events"),
    ).toHaveClass("bx--date-picker__day--described");
  });

  it("exposes open, showMonth, view, and selectedDates on bind:calendar", async () => {
    const { component } = render(DatePickerProps, { value: "03/15/2024" });
    const calendar = await apiOf(component);

    calendar.open();
    calendar.showMonth(new Date(2025, 6, 1));

    expect(calendar.isOpen).toBe(true);
    expect(calendar.view.toDateString()).toBe(
      new Date(2025, 6, 1).toDateString(),
    );
    expect(calendar.selectedDates[0]?.toDateString()).toBe(
      new Date(2024, 2, 15).toDateString(),
    );
  });
});
