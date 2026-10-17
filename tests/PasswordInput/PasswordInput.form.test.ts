import { render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import PasswordInputForm from "./PasswordInput.form.test.svelte";

describe("PasswordInput form reset", () => {
  it("syncs the bound value to the cleared field", async () => {
    render(PasswordInputForm, { props: { value: "s3cret" } });
    const input = screen.getByLabelText("Password");

    await user.type(input, "x");
    expect(input).toHaveValue("s3cretx");

    await resetForm();

    expect(input).toHaveValue("");
    expect(getBoundText()).toBe("");
    expect(new FormData(getForm()).get("pw")).toBe("");
  });

  it("clears a value set on the client with no interaction, like the browser does", async () => {
    render(PasswordInputForm, { props: { value: "s3cret" } });
    const input = screen.getByLabelText("Password");

    await resetForm();

    expect(input).toHaveValue("");
    expect(getBoundText()).toBe("");
  });

  it("follows the field's default value, as with server-rendered markup", async () => {
    render(PasswordInputForm, { props: { value: "s3cret" } });
    const input = screen.getByLabelText("Password");
    assert(input instanceof HTMLInputElement);
    // Server-rendered markup carries the value as the `value` attribute.
    input.defaultValue = "s3cret";

    await user.type(input, "x");
    expect(getBoundText()).toBe("s3cretx");

    await resetForm();

    expect(input).toHaveValue("s3cret");
    expect(getBoundText()).toBe("s3cret");
  });

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

  it("leaves everything alone when the reset is canceled", async () => {
    render(PasswordInputForm);
    const input = screen.getByLabelText("Password");
    getForm().addEventListener("reset", (event) => event.preventDefault());

    await user.type(input, "eric");
    await resetForm();

    expect(input).toHaveValue("eric");
    expect(getBoundText()).toBe("eric");
  });

  it("does not dispatch input or change on reset", async () => {
    const onInput = vi.fn();
    const onChange = vi.fn();
    render(PasswordInputForm, { props: { onInput, onChange } });
    const input = screen.getByLabelText("Password");

    await user.type(input, "e");
    await user.tab();
    expect(onInput).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
    onInput.mockClear();
    onChange.mockClear();

    await resetForm();

    expect(onInput).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
