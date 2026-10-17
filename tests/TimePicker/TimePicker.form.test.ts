import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { getBoundText } from "../utils/get-bound-text";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import TimePickerForm from "./TimePicker.form.test.svelte";

const getAmpm = () => screen.getByTestId("ampm").textContent;

describe("TimePicker form reset", () => {
  it("resyncs a disabled field too", async () => {
    render(TimePickerForm, { props: { value: "10:30", disabled: true } });
    const input = screen.getByLabelText("Time");
    assert(input instanceof HTMLInputElement);

    input.value = "09:15";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();

    await resetForm();

    expect(input).toHaveValue("");
    expect(getBoundText()).toBe("");
  });

  it("resyncs a readonly field too", async () => {
    render(TimePickerForm, { props: { value: "10:30", readonly: true } });
    const input = screen.getByLabelText("Time");
    assert(input instanceof HTMLInputElement);

    input.value = "09:15";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();

    await resetForm();

    expect(input).toHaveValue("");
    expect(getBoundText()).toBe("");
  });

  // TimePickerSelect's shared SelectItem keeps the native <select> on the
  // current choice through a reset, on every Svelte version.
  it("leaves TimePickerSelect's selection untouched by a reset", async () => {
    render(TimePickerForm, { props: { ampm: "pm" } });
    const combobox = screen.getByRole("combobox");

    await user.selectOptions(combobox, "am");
    expect(combobox).toHaveValue("am");

    await resetForm();

    expect(combobox).toHaveValue("am");
    expect(getAmpm()).toBe("am");
  });
});
