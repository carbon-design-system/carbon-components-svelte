import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import RadioButtonForm from "./RadioButton.form.test.svelte";

const getBound = () => screen.getByTestId("bound").textContent;
const getRadio = (name: string) =>
  screen.getByRole("radio", { name }) as HTMLInputElement;

describe("RadioButton form reset", () => {
  it("unchecks a standalone radio button with no default", async () => {
    render(RadioButtonForm);

    await user.click(getRadio("Large"));
    expect(getBound()).toBe("false-true");

    getForm().reset();
    await flushFormReset();

    expect(getRadio("Large")).not.toBeChecked();
    expect(getBound()).toBe("false-false");
  });

  it("follows the default checked radio button, as with server-rendered markup", async () => {
    render(RadioButtonForm, { props: { small: true } });
    // Server-rendered markup carries the state as the `checked` attribute.
    getRadio("Small").defaultChecked = true;

    await user.click(getRadio("Large"));
    expect(getBound()).toBe("false-true");

    getForm().reset();
    await flushFormReset();

    expect(getRadio("Small")).toBeChecked();
    expect(getBound()).toBe("true-false");
  });
});
