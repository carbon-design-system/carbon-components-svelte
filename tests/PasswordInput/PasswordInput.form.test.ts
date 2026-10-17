import { render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import PasswordInputForm from "./PasswordInput.form.test.svelte";

describe("PasswordInput form reset", () => {
  it("resets an empty value to an empty string", async () => {
    render(PasswordInputForm, { props: { value: "" } });
    const input = screen.getByLabelText("Password");

    await user.type(input, "abc");
    await resetForm();

    expect(input).toHaveValue("");
    expect(getBoundText()).toBe("");
  });

  it("keeps the show/hide toggle state, but the value still follows the field", async () => {
    render(PasswordInputForm, { props: { value: "s3cret" } });
    const input = screen.getByLabelText("Password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");

    await user.type(input, "x");
    await resetForm();

    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("");
    expect(getBoundText()).toBe("");
  });
});
