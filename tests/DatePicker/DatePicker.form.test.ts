import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import DatePickerForm from "./DatePicker.form.test.svelte";

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
});
