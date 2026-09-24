import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import DatePickerSelectedDates from "./DatePickerSelectedDates.test.svelte";

const getBound = () => screen.getByTestId("bound").textContent;
const getDates = () => screen.getByTestId("dates").textContent?.trim();
const dayLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

async function clickDay(day: number) {
  const now = new Date();
  const calendar = await screen.findByLabelText("calendar-container");
  const cell = calendar.querySelector<HTMLElement>(
    `[aria-label="${dayLabel(new Date(now.getFullYear(), now.getMonth(), day))}"]`,
  );
  if (!cell) throw new Error(`expected day ${day}`);
  await user.click(cell);
  return new Date(now.getFullYear(), now.getMonth(), day);
}

describe("DatePicker bind:selectedDates", () => {
  it("mirrors a picked day", async () => {
    render(DatePickerSelectedDates);
    await user.click(screen.getByLabelText("Date"));
    const picked = await clickDay(12);

    expect(getDates()).toBe(picked.toDateString());
  });

  it("selects dates set through the prop without dispatching change", async () => {
    const onchange = vi.fn();
    const { rerender } = render(DatePickerSelectedDates, {
      props: { onchange },
    });
    await screen.findByLabelText("calendar-container");

    await rerender({ selectedDates: [new Date(2024, 0, 15)] });
    await tick();

    expect(getBound()).toBe("01/15/2024||");
    expect(screen.getByLabelText("Date")).toHaveValue("01/15/2024");
    expect(onchange).not.toHaveBeenCalled();
  });

  it("follows value", async () => {
    const { rerender } = render(DatePickerSelectedDates);
    await screen.findByLabelText("calendar-container");

    await rerender({ value: "02/01/2024" });

    await waitFor(() =>
      expect(getDates()).toBe(new Date(2024, 1, 1).toDateString()),
    );
  });

  it("sets both ends of a range", async () => {
    const { rerender } = render(DatePickerSelectedDates, {
      props: { datePickerType: "range" },
    });
    await screen.findByLabelText("calendar-container");

    await rerender({
      selectedDates: [new Date(2024, 0, 10), new Date(2024, 0, 20)],
    });
    await tick();

    expect(getBound()).toBe("|01/10/2024|01/20/2024");
    expect(screen.getByLabelText("Start date")).toHaveValue("01/10/2024");
    expect(screen.getByLabelText("End date")).toHaveValue("01/20/2024");
  });

  it("mirrors multiple picks in click order", async () => {
    render(DatePickerSelectedDates, {
      props: { datePickerType: "multiple" },
    });
    await user.click(screen.getByLabelText("Date"));
    const first = await clickDay(20);
    const second = await clickDay(5);

    expect(getDates()).toBe(
      [first.toDateString(), second.toDateString()].join(","),
    );
  });

  it("lets a non-empty value win at mount", async () => {
    render(DatePickerSelectedDates, {
      props: { value: "03/01/2024", selectedDates: [new Date(2024, 0, 1)] },
    });

    await waitFor(() =>
      expect(getDates()).toBe(new Date(2024, 2, 1).toDateString()),
    );
    expect(getBound()).toBe("03/01/2024||");
  });

  it("seeds the value from selectedDates when value is empty", async () => {
    render(DatePickerSelectedDates, {
      props: { selectedDates: [new Date(2024, 0, 1)] },
    });

    await waitFor(() => expect(getBound()).toBe("01/01/2024||"));
  });

  it("clears the selection when set to an empty array", async () => {
    const { rerender } = render(DatePickerSelectedDates, {
      props: { value: "01/15/2024" },
    });
    await waitFor(() =>
      expect(getDates()).toBe(new Date(2024, 0, 15).toDateString()),
    );

    await rerender({ selectedDates: [] });
    await tick();

    expect(getBound()).toBe("||");
    expect(screen.getByLabelText("Date")).toHaveValue("");
  });

  it("is ignored in simple mode", async () => {
    render(DatePickerSelectedDates, {
      props: {
        datePickerType: "simple",
        value: "01/15/2024",
        selectedDates: [new Date(2024, 0, 1)],
      },
    });
    await tick();

    expect(getBound()).toBe("01/15/2024||");
  });

  it("does not redraw or rebuild the calendar for an equal array", async () => {
    const { rerender } = render(DatePickerSelectedDates, {
      props: { value: "01/15/2024" },
    });
    const calendar = await screen.findByLabelText("calendar-container");
    const input = screen.getByLabelText("Date") as HTMLInputElement & {
      _flatpickr?: unknown;
    };
    await waitFor(() =>
      expect(getDates()).toBe(new Date(2024, 0, 15).toDateString()),
    );
    const instance = input._flatpickr;
    const cell = calendar.querySelector(".flatpickr-day.selected");

    await rerender({ selectedDates: [new Date(2024, 0, 15)] });
    await tick();

    expect(input._flatpickr).toBe(instance);
    // A redraw would replace every day cell.
    expect(cell?.isConnected).toBe(true);
  });

  it("hands out copies, so mutating a bound Date leaves the calendar alone", async () => {
    let bound: ReadonlyArray<Date> = [];
    render(DatePickerSelectedDates, {
      props: { value: "01/15/2024", ondates: (dates) => (bound = dates) },
    });
    const input = screen.getByLabelText("Date") as HTMLInputElement & {
      _flatpickr?: { selectedDates: Date[] };
    };
    await waitFor(() => expect(bound).toHaveLength(1));

    bound[0].setDate(20);

    expect(input._flatpickr?.selectedDates[0].getDate()).toBe(15);
    expect(input).toHaveValue("01/15/2024");
  });

  it("follows a form reset", async () => {
    render(DatePickerSelectedDates, { props: { value: "01/15/2024" } });
    await waitFor(() =>
      expect(getDates()).toBe(new Date(2024, 0, 15).toDateString()),
    );

    (screen.getByTestId("form") as HTMLFormElement).reset();
    // The reset sync runs on the next task.
    await new Promise((resolve) => setTimeout(resolve));
    await tick();

    expect(getBound()).toBe("||");
    expect(getDates()).toBe("");
  });
});
