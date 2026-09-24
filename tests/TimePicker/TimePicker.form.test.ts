import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import TimePickerForm from "./TimePicker.form.test.svelte";

const getValue = () => screen.getByTestId("value").textContent;
const getAmpm = () => screen.getByTestId("ampm").textContent;

describe("TimePicker form reset", () => {
  // Svelte 5 already passes case 1 with no fix: `handleFormReset` is a
  // no-op read of a `ref.value` that Svelte already resynced after a
  // reset. Svelte 3 and 4 fail case 1 without the fix: `value` stays at
  // the pre-reset text. A passing run on root alone does not prove
  // Svelte 3/4 are fixed.
  it("syncs the cleared field", async () => {
    render(TimePickerForm, { props: { value: "10:30" } });
    const input = screen.getByLabelText("Time");

    await user.clear(input);
    await user.type(input, "09:15");
    expect(input).toHaveValue("09:15");

    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("");
    expect(getValue()).toBe("");
    expect(new FormData(getForm()).get("time")).toBe("");
  });

  // Deviation from the prompt's Test section item 2 ("Equal-value no-op"),
  // which claimed a client-rendered value survives a no-interaction reset.
  // `bind:value` never sets a `value` attribute, so `defaultValue` is always
  // "" (confirmed directly: rendering with value: "10:30" gives
  // input.defaultValue === ""), the same as every sibling in this batch
  // (TextArea, PasswordInput, Search) whose prompts explicitly call out
  // that a client-rendered default is "" regardless of interaction.
  it("clears a client-rendered value to empty on reset, even with no interaction", async () => {
    render(TimePickerForm, { props: { value: "10:30" } });
    const input = screen.getByLabelText("Time");

    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("");
    expect(getValue()).toBe("");
  });

  it("resyncs a disabled field too", async () => {
    render(TimePickerForm, { props: { value: "10:30", disabled: true } });
    const input = screen.getByLabelText("Time");
    assert(input instanceof HTMLInputElement);

    input.value = "09:15";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();

    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("");
    expect(getValue()).toBe("");
  });

  it("resyncs a readonly field too", async () => {
    render(TimePickerForm, { props: { value: "10:30", readonly: true } });
    const input = screen.getByLabelText("Time");
    assert(input instanceof HTMLInputElement);

    input.value = "09:15";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();

    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("");
    expect(getValue()).toBe("");
  });

  it("leaves everything alone when the reset is canceled", async () => {
    render(TimePickerForm, { props: { value: "10:30" } });
    const input = screen.getByLabelText("Time");
    getForm().addEventListener("reset", (event) => event.preventDefault());

    await user.clear(input);
    await user.type(input, "09:15");
    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("09:15");
    expect(getValue()).toBe("09:15");
  });

  it("does not dispatch input or change on reset", async () => {
    const onInput = vi.fn();
    const onChange = vi.fn();
    render(TimePickerForm, { props: { value: "10:30", onInput, onChange } });
    const input = screen.getByLabelText("Time");

    await user.clear(input);
    await user.type(input, "09:15");
    onInput.mockClear();
    onChange.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(onInput).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  // Regression guard: TimePickerSelect's shared SelectItem already keeps
  // the native <select> on the current choice through a reset, on every
  // Svelte version. This is not a bug this prompt fixes; it pins the
  // existing behavior so a later change doesn't silently regress it.
  it("leaves TimePickerSelect's selection untouched by a reset", async () => {
    render(TimePickerForm, { props: { ampm: "pm" } });
    const combobox = screen.getByRole("combobox");

    await user.selectOptions(combobox, "am");
    expect(combobox).toHaveValue("am");

    getForm().reset();
    await flushFormReset();

    expect(combobox).toHaveValue("am");
    expect(getAmpm()).toBe("am");
  });
});
