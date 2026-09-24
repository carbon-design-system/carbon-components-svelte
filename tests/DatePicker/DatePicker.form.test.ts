import { render, screen } from "@testing-library/svelte";
import type { Instance } from "flatpickr/dist/types/instance";
import { flushFormReset } from "../utils/flush-form-reset";
import { user } from "../utils/user";
import DatePickerForm from "./DatePicker.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;

function renderWithCalendar(props: Record<string, unknown> = {}) {
  let calendar: Instance | null = null;
  render(DatePickerForm, {
    props: {
      ...props,
      oncalendar: (cal: Instance | null | undefined) => {
        calendar = cal ?? null;
      },
    },
  });
  return () =>
    vi.waitFor(() => {
      if (!calendar) throw new Error("calendar not set");
      return calendar;
    });
}

async function pickFirstDay() {
  await user.click(screen.getByLabelText("Date"));
  const calendar = await screen.findByLabelText("calendar-container");
  const day = calendar.querySelector<HTMLElement>(
    ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay):not(.selected)",
  );
  if (!day) throw new Error("expected a selectable day");
  await user.click(day);
}

describe("DatePicker form reset", () => {
  it("clears the bound value and the selection", async () => {
    const getCalendar = renderWithCalendar();
    const calendar = await getCalendar();
    await pickFirstDay();
    const input = screen.getByLabelText("Date");
    expect(getBound()).not.toBe("||");

    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("");
    expect(getBound()).toBe("||");
    expect(calendar.selectedDates).toEqual([]);
    expect(new FormData(getForm()).get("date")).toBe("");
  });

  it("clears both ends of a range", async () => {
    const getCalendar = renderWithCalendar({
      datePickerType: "range",
      valueFrom: "01/10/2024",
      valueTo: "01/20/2024",
    });
    const calendar = await getCalendar();
    expect(calendar.selectedDates).toHaveLength(2);

    getForm().reset();
    await flushFormReset();

    expect(screen.getByLabelText("Start")).toHaveValue("");
    expect(screen.getByLabelText("End")).toHaveValue("");
    expect(getBound()).toBe("||");
    expect(calendar.selectedDates).toEqual([]);
  });

  it("clears a simple field", async () => {
    render(DatePickerForm, { props: { datePickerType: "simple" } });

    await user.type(screen.getByLabelText("Date"), "01/15/2024");
    getForm().reset();
    await flushFormReset();

    expect(getBound()).toBe("||");
  });

  it("follows the field's default value, as with server-rendered markup", async () => {
    const getCalendar = renderWithCalendar({ value: "01/15/2024" });
    const calendar = await getCalendar();
    const input = screen.getByLabelText("Date") as HTMLInputElement;
    // Server-rendered markup carries the value as the `value` attribute.
    input.defaultValue = "01/15/2024";
    await pickFirstDay();
    expect(getBound()).not.toBe("01/15/2024||");

    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("01/15/2024");
    expect(getBound()).toBe("01/15/2024||");
    expect(calendar.selectedDates.map((date) => date.getTime())).toEqual([
      new Date(2024, 0, 15).getTime(),
    ]);
  });

  it("leaves everything alone when the reset is canceled", async () => {
    const getCalendar = renderWithCalendar();
    const calendar = await getCalendar();
    getForm().addEventListener("reset", (event) => event.preventDefault());
    await pickFirstDay();
    const bound = getBound();

    getForm().reset();
    await flushFormReset();

    expect(getBound()).toBe(bound);
    expect(calendar.selectedDates).toHaveLength(1);
  });

  it("does not dispatch change on reset", async () => {
    const onChange = vi.fn();
    const getCalendar = renderWithCalendar({ onChange });
    await getCalendar();
    await pickFirstDay();
    onChange.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps a read-only picker as it was", async () => {
    const getCalendar = renderWithCalendar({
      value: "01/02/2024",
      readonly: true,
    });
    await getCalendar();

    getForm().reset();
    await flushFormReset();

    expect(screen.getByLabelText("Date")).toHaveValue("01/02/2024");
    expect(getBound()).toBe("01/02/2024||");
  });

  it("keeps a read-only range as it was", async () => {
    const getCalendar = renderWithCalendar({
      datePickerType: "range",
      valueFrom: "01/02/2024",
      valueTo: "01/09/2024",
      readonly: true,
    });
    await getCalendar();

    getForm().reset();
    await flushFormReset();

    expect(screen.getByLabelText("Start")).toHaveValue("01/02/2024");
    expect(screen.getByLabelText("End")).toHaveValue("01/09/2024");
    expect(getBound()).toBe("|01/02/2024|01/09/2024");
  });
});
