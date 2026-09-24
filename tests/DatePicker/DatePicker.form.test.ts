import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import DatePickerForm from "./DatePicker.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getValue = () => screen.getByTestId("value").textContent;
const getValueFrom = () => screen.getByTestId("valueFrom").textContent;
const getValueTo = () => screen.getByTestId("valueTo").textContent;
/** The reset sync runs on the next task. */
const flush = () => new Promise((resolve) => setTimeout(resolve));

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
  describe("simple mode", () => {
    it("resyncs the bound value after editing then resetting", async () => {
      render(DatePickerForm, { props: { value: "2024-01-01" } });
      const input = screen.getByLabelText("Start date") as HTMLInputElement;

      await editInput(input, "2024-06-15");
      getForm().reset();
      await flush();

      expect(input).toHaveValue("");
      expect(getValue()).toBe("");
      expect(new FormData(getForm()).get("tripStart")).toBe("");
    });

    it("clears an untouched, non-empty client value, like a native input", async () => {
      render(DatePickerForm, { props: { value: "2024-01-01" } });
      const input = screen.getByLabelText("Start date") as HTMLInputElement;

      getForm().reset();
      await flush();

      expect(input).toHaveValue("");
      expect(getValue()).toBe("");
    });

    it("follows the field's default value, as with server-rendered markup", async () => {
      render(DatePickerForm, { props: { value: "2024-01-01" } });
      const input = screen.getByLabelText("Start date") as HTMLInputElement;
      // Server-rendered markup carries the value as the `value` attribute.
      input.defaultValue = "2024-01-01";

      await editInput(input, "2024-06-15");
      getForm().reset();
      await flush();

      expect(input).toHaveValue("2024-01-01");
      expect(getValue()).toBe("2024-01-01");
    });

    it("resets an empty initial value back to empty", async () => {
      render(DatePickerForm, { props: { value: "" } });
      const input = screen.getByLabelText("Start date") as HTMLInputElement;

      await editInput(input, "2024-06-15");
      getForm().reset();
      await flush();

      expect(input).toHaveValue("");
      expect(getValue()).toBe("");
      expect(new FormData(getForm()).get("tripStart")).toBe("");
    });
  });

  describe("range mode", () => {
    it("clears both sides after both are edited", async () => {
      render(DatePickerForm, {
        props: {
          datePickerType: "range",
          valueFrom: "2024-03-15",
          valueTo: "2024-03-20",
        },
      });
      const start = screen.getByLabelText("Start date") as HTMLInputElement;
      const end = screen.getByLabelText("End date") as HTMLInputElement;

      await editInput(start, "2024-04-01");
      await editInput(end, "2024-04-10");
      getForm().reset();
      await flush();

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
      const start = screen.getByLabelText("Start date") as HTMLInputElement;
      const end = screen.getByLabelText("End date") as HTMLInputElement;

      await editInput(end, "2024-04-10");
      getForm().reset();
      await flush();

      expect(start).toHaveValue("");
      expect(end).toHaveValue("");
      expect(getValueFrom()).toBe("");
      expect(getValueTo()).toBe("");
    });

    it("resets empty initial values back to empty on both sides", async () => {
      render(DatePickerForm, {
        props: { datePickerType: "range", valueFrom: "", valueTo: "" },
      });
      const start = screen.getByLabelText("Start date") as HTMLInputElement;
      const end = screen.getByLabelText("End date") as HTMLInputElement;

      await editInput(start, "2024-04-01");
      await editInput(end, "2024-04-10");
      getForm().reset();
      await flush();

      expect(start).toHaveValue("");
      expect(end).toHaveValue("");
    });
  });

  it("leaves everything alone when the reset is canceled", async () => {
    render(DatePickerForm, { props: { value: "2024-01-01" } });
    const input = screen.getByLabelText("Start date") as HTMLInputElement;
    getForm().addEventListener("reset", (event) => event.preventDefault());

    await editInput(input, "2024-06-15");
    getForm().reset();
    await flush();

    expect(input).toHaveValue("2024-06-15");
    expect(getValue()).toBe("2024-06-15");
  });

  it("does not dispatch change on reset", async () => {
    const onChange = vi.fn();
    render(DatePickerForm, { props: { value: "2024-01-01", onChange } });
    const input = screen.getByLabelText("Start date") as HTMLInputElement;

    await editInput(input, "2024-06-15");
    onChange.mockClear();

    getForm().reset();
    await flush();

    expect(onChange).not.toHaveBeenCalled();
  });
});
