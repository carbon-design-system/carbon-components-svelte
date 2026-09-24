import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import PasswordInputForm from "./PasswordInput.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;
/** The reset sync runs on the next task. */
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe("PasswordInput form reset", () => {
  it("syncs the bound value to the cleared field", async () => {
    render(PasswordInputForm, { props: { value: "s3cret" } });
    const input = screen.getByLabelText("Password");

    await user.type(input, "x");
    expect(input).toHaveValue("s3cretx");

    getForm().reset();
    await flush();

    expect(input).toHaveValue("");
    expect(getBound()).toBe("");
    expect(new FormData(getForm()).get("pw")).toBe("");
  });

  it("clears a value set on the client with no interaction, like the browser does", async () => {
    render(PasswordInputForm, { props: { value: "s3cret" } });
    const input = screen.getByLabelText("Password");

    getForm().reset();
    await flush();

    expect(input).toHaveValue("");
    expect(getBound()).toBe("");
  });

  it("follows the field's default value, as with server-rendered markup", async () => {
    render(PasswordInputForm, { props: { value: "s3cret" } });
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    // Server-rendered markup carries the value as the `value` attribute.
    input.defaultValue = "s3cret";

    await user.type(input, "x");
    expect(getBound()).toBe("s3cretx");

    getForm().reset();
    await flush();

    expect(input).toHaveValue("s3cret");
    expect(getBound()).toBe("s3cret");
  });

  it("resets an empty value to an empty string", async () => {
    render(PasswordInputForm, { props: { value: "" } });
    const input = screen.getByLabelText("Password");

    await user.type(input, "abc");
    getForm().reset();
    await flush();

    expect(input).toHaveValue("");
    expect(getBound()).toBe("");
  });

  it("keeps the show/hide toggle state, but the value still follows the field", async () => {
    render(PasswordInputForm, { props: { value: "s3cret" } });
    const input = screen.getByLabelText("Password") as HTMLInputElement;

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");

    await user.type(input, "x");
    getForm().reset();
    await flush();

    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("");
    expect(getBound()).toBe("");
  });

  it("leaves everything alone when the reset is canceled", async () => {
    render(PasswordInputForm);
    const input = screen.getByLabelText("Password");
    getForm().addEventListener("reset", (event) => event.preventDefault());

    await user.type(input, "eric");
    getForm().reset();
    await flush();

    expect(input).toHaveValue("eric");
    expect(getBound()).toBe("eric");
  });

  it("does not dispatch input or change on reset", async () => {
    const onInput = vi.fn();
    const onChange = vi.fn();
    render(PasswordInputForm, { props: { onInput, onChange } });
    const input = screen.getByLabelText("Password");

    await user.type(input, "e");
    onInput.mockClear();
    onChange.mockClear();

    getForm().reset();
    await flush();

    expect(onInput).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
