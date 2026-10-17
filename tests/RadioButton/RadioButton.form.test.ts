import { render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import RadioButtonForm from "./RadioButton.form.test.svelte";
import RadioButtonReadonlyForm from "./RadioButtonReadonly.form.test.svelte";

const getRadio = (name: string) => {
  const radio = screen.getByRole("radio", { name });
  assert(radio instanceof HTMLInputElement);
  return radio;
};

describe("RadioButton form reset", () => {
  it("unchecks a standalone radio button with no default", async () => {
    render(RadioButtonForm);

    await user.click(getRadio("Large"));
    expect(getBoundText()).toBe("false-true");

    await resetForm();

    expect(getRadio("Large")).not.toBeChecked();
    expect(getBoundText()).toBe("false-false");
  });

  it("follows the default checked radio button, as with server-rendered markup", async () => {
    render(RadioButtonForm, { props: { small: true } });
    // Server-rendered markup carries the state as the `checked` attribute.
    getRadio("Small").defaultChecked = true;

    await user.click(getRadio("Large"));
    expect(getBoundText()).toBe("false-true");

    await resetForm();

    expect(getRadio("Small")).toBeChecked();
    expect(getBoundText()).toBe("true-false");
  });

  it("keeps a readonly radio button's state across a form reset", async () => {
    render(RadioButtonReadonlyForm);

    expect(getRadio("Readonly")).toBeChecked();

    await resetForm();

    expect(getRadio("Readonly")).toBeChecked();
    expect(getBoundText()).toBe("true");
  });
});
