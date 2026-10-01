import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import { getCalendarInstance } from "./calendar-instance";
import DatePickerForm from "./DatePicker.form.test.svelte";
import DatePickerDisplayFormatForm from "./DatePickerDisplayFormat.test.svelte";
import { visibleInput } from "./helpers";

const getValueFrom = () => getBoundText("valueFrom");
const getValueTo = () => getBoundText("valueTo");
// Let the component's own pending re-render (triggered by `input`/`change`)
// settle before a subsequent `form.reset()`, the same way an `await
// user.type(...)` naturally would; otherwise that pending write can land
// after the browser's native reset and reintroduce the edited text.
async function editInput(input: HTMLElement, value: string) {
  fireEvent.input(input, { target: { value } });
  fireEvent.change(input, { target: { value } });
  await tick();
}

const getValue = () => getBoundText("value");
const getHiddenInput = () =>
  document.querySelector<HTMLInputElement>("input[name='meeting']");

async function pickDay20() {
  const input = await visibleInput();
  await user.click(input);
  const calendar = await screen.findByLabelText("calendar-container");
  const day = within(calendar)
    .getAllByText("20")
    .find(
      (el) =>
        el.classList.contains("flatpickr-day") &&
        !el.classList.contains("prevMonthDay") &&
        !el.classList.contains("nextMonthDay"),
    );
  assert(day);
  await user.click(day);
}

describe("DatePicker form reset", () => {
  describe("range mode", () => {
    it("clears both sides after both are edited", async () => {
      render(DatePickerForm, {
        props: {
          datePickerType: "range",
          valueFrom: "2024-03-15",
          valueTo: "2024-03-20",
        },
      });
      const start = screen.getByLabelText("Start date");
      const end = screen.getByLabelText("End date");

      await editInput(start, "2024-04-01");
      await editInput(end, "2024-04-10");
      await resetForm();

      expect(start).toHaveValue("");
      expect(end).toHaveValue("");
      expect(getValueFrom()).toBe("");
      expect(getValueTo()).toBe("");
      expect(new FormData(getForm()).get("tripStart")).toBe("");
      expect(new FormData(getForm()).get("tripEnd")).toBe("");
    });

    it("clears the calendar selection", async () => {
      render(DatePickerForm, {
        props: {
          datePickerType: "range",
          valueFrom: "2024-03-15",
          valueTo: "2024-03-20",
        },
      });
      const start = screen.getByLabelText("Start date");
      await vi.waitFor(() =>
        expect(getCalendarInstance(start).selectedDates).toHaveLength(2),
      );

      await resetForm();

      expect(getCalendarInstance(start).selectedDates).toEqual([]);
    });

    it("clears both sides even when only one was edited", async () => {
      render(DatePickerForm, {
        props: {
          datePickerType: "range",
          valueFrom: "2024-03-15",
          valueTo: "2024-03-20",
        },
      });
      const start = screen.getByLabelText("Start date");
      const end = screen.getByLabelText("End date");

      await editInput(end, "2024-04-10");
      await resetForm();

      expect(start).toHaveValue("");
      expect(end).toHaveValue("");
      expect(getValueFrom()).toBe("");
      expect(getValueTo()).toBe("");
    });

    it("resets empty initial values back to empty on both sides", async () => {
      render(DatePickerForm, {
        props: { datePickerType: "range", valueFrom: "", valueTo: "" },
      });
      const start = screen.getByLabelText("Start date");
      const end = screen.getByLabelText("End date");

      await editInput(start, "2024-04-01");
      await editInput(end, "2024-04-10");
      await resetForm();

      expect(start).toHaveValue("");
      expect(end).toHaveValue("");
    });
  });

  describe("displayFormat", () => {
    it("clears the visible and hidden inputs after editing through the calendar, then resetting", async () => {
      render(DatePickerDisplayFormatForm);
      await pickDay20();

      const hidden = getHiddenInput();
      await vi.waitFor(() => expect(hidden).toHaveValue("2024-03-20"));
      expect(hidden?.type).toBe("hidden");

      await resetForm();

      const visible = await visibleInput();
      expect(visible).toHaveValue("");
      expect(getHiddenInput()).toHaveValue("");
      expect(getValue()).toBe("");
      expect(new FormData(getForm()).get("meeting")).toBe("");
    });

    it("clears both inputs even with no prior interaction", async () => {
      render(DatePickerDisplayFormatForm);
      const visible = await visibleInput();
      await vi.waitFor(() => expect(visible).toHaveValue("March 15, 2024"));

      await resetForm();

      expect(visible).toHaveValue("");
      expect(getHiddenInput()).toHaveValue("");
      expect(getValue()).toBe("");
    });

    it("leaves everything alone when the reset is canceled", async () => {
      render(DatePickerDisplayFormatForm);
      await pickDay20();
      getForm().addEventListener("reset", (event) => event.preventDefault());
      const hidden = getHiddenInput();
      const hiddenValue = hidden?.value;

      await resetForm();

      expect(getHiddenInput()).toHaveValue(hiddenValue);
      expect(getValue()).toBe(hiddenValue);
    });
  });
});
