import { render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import DatePicker from "./DatePicker.test.svelte";
import DatePickerInline from "./DatePickerInline.test.svelte";
import { clickNextMonth, findDay } from "./helpers";

describe("DatePicker inline", () => {
  it("renders the calendar without opening it and marks the root", async () => {
    const { container } = render(DatePickerInline);

    await screen.findByLabelText(/^Choose a /);
    expect(container.querySelector(".bx--date-picker")).toHaveClass(
      "bx--date-picker--inline",
    );
  });

  it("dispatches change but never open or close", async () => {
    const onevent = vi.fn();
    render(DatePickerInline, { onevent });
    const calendar = await screen.findByLabelText(/^Choose a /);

    await user.click(screen.getByLabelText("Date"));
    await user.click(findDay(calendar, "10"));
    await tick();
    await tick();

    expect(screen.getByTestId("value")).toHaveTextContent("03/10/2024");
    const events = onevent.mock.calls.map(([name]) => name);
    expect(events).toContain("change");
    expect(events).not.toContain("open");
    expect(events).not.toContain("close");
  });

  it("ignores portalMenu", async () => {
    const { container } = render(DatePickerInline, { portalMenu: true });

    const calendar = await screen.findByLabelText(/^Choose a /);
    expect(container.querySelector(".bx--date-picker")).toContainElement(
      calendar,
    );
  });

  it("switches between inline and popup after mount, keeping the value", async () => {
    const { rerender } = render(DatePickerInline);
    const inlineCalendar = await screen.findByLabelText(/^Choose a /);

    await rerender({ inline: false });
    await vi.waitFor(() => {
      const calendar = screen.getByLabelText(/^Choose a /);
      expect(calendar).not.toBe(inlineCalendar);
      expect(calendar).not.toHaveClass("bx--date-picker__calendar--inline");
    });
    expect(screen.getByLabelText("Date")).toHaveValue("03/15/2024");

    await rerender({ inline: true });
    await vi.waitFor(() =>
      expect(screen.getByLabelText(/^Choose a /)).toHaveClass(
        "bx--date-picker__calendar--inline",
      ),
    );
    expect(screen.getByTestId("value")).toHaveTextContent("03/15/2024");
  });

  describe("inline calendar interaction states", () => {
    it.each(["readonly", "disabled"] as const)(
      "blocks selection while the input is %s and restores it after",
      async (state) => {
        const props: ComponentProps<DatePicker> = {
          datePickerType: "single",
          value: "03/15/2024",
          inline: true,
        };
        const { rerender } = render(DatePicker, { ...props, [state]: true });
        const calendar = await screen.findByLabelText(/^Choose a /);
        const input = screen.getByLabelText("Date");
        await vi.waitFor(() =>
          expect(calendar).toHaveAttribute("aria-disabled", "true"),
        );

        await user.click(findDay(calendar, "10"));
        expect(input).toHaveValue("03/15/2024");
        await clickNextMonth(calendar);
        expect(
          calendar.querySelector(".bx--date-picker__month-label"),
        ).toHaveTextContent("March");

        await rerender({ ...props, [state]: false });
        await vi.waitFor(() =>
          expect(calendar).not.toHaveAttribute("aria-disabled"),
        );
        await user.click(findDay(calendar, "10"));
        expect(input).toHaveValue("03/10/2024");
      },
    );
  });

  it("leaves Carbon's markup intact when an inline calendar is rebuilt", async () => {
    const props: ComponentProps<DatePicker> = {
      helperText: "Pick a weekday",
      inline: true,
    };
    const { container, rerender } = render(DatePicker, {
      ...props,
      datePickerType: "single",
    });
    await screen.findByLabelText(/^Choose a /);

    await rerender({ ...props, datePickerType: "multiple" });
    await vi.waitFor(() =>
      expect(screen.getAllByLabelText(/^Choose a /)).toHaveLength(1),
    );
    expect(screen.getByText("Pick a weekday")).toBeInTheDocument();
    expect(
      container.querySelector(".bx--date-picker-container"),
    ).toContainElement(screen.getByLabelText("Date"));
  });

  it("applies Carbon classes to an inline calendar that never opens", async () => {
    render(DatePicker, {
      datePickerType: "single",
      inline: true,
    });

    const calendar = await screen.findByLabelText(/^Choose a /);
    expect(calendar).toHaveClass(
      "bx--date-picker__calendar--inline",
      "bx--date-picker__calendar",
    );
    expect(calendar.querySelector(".bx--date-picker__day")).toHaveClass(
      "bx--date-picker__day",
    );
    // Inside the input wrapper it would stretch the box that vertically
    // centers the calendar icon.
    expect(calendar.closest(".bx--date-picker-input__wrapper")).toBeNull();
    expect(calendar.previousElementSibling).toHaveClass(
      "bx--date-picker-input__wrapper",
    );
    expect(
      calendar.querySelector(".bx--date-picker__month-label"),
    ).toBeInTheDocument();
  });
});
