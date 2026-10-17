import { render, screen, within } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import DatePickerDisplayFormatForm from "./DatePickerDisplayFormat.form.test.svelte";
import { visibleInput } from "./helpers";

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

describe("DatePicker displayFormat form reset", () => {
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
