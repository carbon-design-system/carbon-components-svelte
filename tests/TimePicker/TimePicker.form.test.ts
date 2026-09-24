import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { user } from "../utils/user";
import TimePickerForm from "./TimePicker.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;
const getInput = () =>
  screen.getByRole("textbox", { name: "Time" }) as HTMLInputElement;

describe("TimePicker form reset", () => {
  it("syncs the bound value to the cleared field", async () => {
    render(TimePickerForm);
    const input = getInput();

    await user.type(input, "10:30");
    expect(getBound()).toBe("10:30");

    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("");
    expect(getBound()).toBe("");
    expect(new FormData(getForm()).get("time")).toBe("");
  });

  it("follows the field's default value, as with server-rendered markup", async () => {
    render(TimePickerForm, { props: { value: "9:15" } });
    const input = getInput();
    // Server-rendered markup carries the value as the `value` attribute.
    input.defaultValue = "9:15";

    await user.type(input, "x");
    expect(getBound()).toBe("9:15x");

    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("9:15");
    expect(getBound()).toBe("9:15");
  });

  it("syncs the fluid variant", async () => {
    render(TimePickerForm, { props: { fluid: true } });

    await user.type(getInput(), "10:30");
    getForm().reset();
    await flushFormReset();

    expect(getBound()).toBe("");
  });

  it("keeps the value when the reset is cancelled", async () => {
    render(TimePickerForm);
    const input = getInput();

    await user.type(input, "10:30");
    getForm().addEventListener("reset", (e) => e.preventDefault(), {
      once: true,
    });
    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("10:30");
    expect(getBound()).toBe("10:30");
  });
});
