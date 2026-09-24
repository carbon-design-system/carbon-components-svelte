import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { user } from "../utils/user";
import PasswordInputForm from "./PasswordInput.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;
const getField = () =>
  screen.getByLabelText("Password", { selector: "input" }) as HTMLInputElement;

describe("PasswordInput form reset", () => {
  it("syncs the bound value to the cleared field", async () => {
    render(PasswordInputForm);
    const field = getField();

    await user.type(field, "hunter2");
    expect(getBound()).toBe("hunter2");

    getForm().reset();
    await flushFormReset();

    expect(field).toHaveValue("");
    expect(getBound()).toBe("");
  });

  it("follows the field's default value, as with server-rendered markup", async () => {
    render(PasswordInputForm, { props: { value: "ada" } });
    const field = getField();
    // Server-rendered markup carries the value as the default value.
    field.defaultValue = "ada";

    await user.type(field, "x");
    expect(getBound()).toBe("adax");

    getForm().reset();
    await flushFormReset();

    expect(field).toHaveValue("ada");
    expect(getBound()).toBe("ada");
  });
});
