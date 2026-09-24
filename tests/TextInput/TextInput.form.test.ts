import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import TextInputForm from "./TextInput.form.test.svelte";

describe("TextInput form reset", () => {
  it("syncs the bound value to the cleared field", async () => {
    render(TextInputForm);
    const input = screen.getByRole("textbox", { name: "User" });

    await user.type(input, "eric");
    expect(getBoundText()).toBe("eric");

    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("");
    expect(getBoundText()).toBe("");
    expect(new FormData(getForm()).get("user")).toBe("");
  });

  it("clears a value set on the client, like the browser does", async () => {
    render(TextInputForm, { props: { value: "ada" } });
    const input = screen.getByRole("textbox", { name: "User" });

    await user.type(input, "x");
    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("");
    expect(getBoundText()).toBe("");
  });

  it("follows the field's default value, as with server-rendered markup", async () => {
    render(TextInputForm, { props: { value: "ada" } });
    const input = screen.getByRole("textbox", {
      name: "User",
    });
    assert(input instanceof HTMLInputElement);
    // Server-rendered markup carries the value as the `value` attribute.
    input.defaultValue = "ada";

    await user.type(input, "x");
    expect(getBoundText()).toBe("adax");

    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("ada");
    expect(getBoundText()).toBe("ada");
  });

  it("parses a number field", async () => {
    render(TextInputForm, { props: { type: "number", value: 5 } });
    const input = screen.getByRole("spinbutton", {
      name: "User",
    });
    assert(input instanceof HTMLInputElement);
    input.defaultValue = "5";

    await user.type(input, "7");
    expect(getBoundText()).toBe("57");

    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue(5);
    expect(getBoundText()).toBe("5");
  });

  it("sets an emptied number field to null", async () => {
    render(TextInputForm, { props: { type: "number" } });
    const input = screen.getByRole("spinbutton", { name: "User" });

    await user.type(input, "7");
    getForm().reset();
    await flushFormReset();

    expect(getBoundText()).toBe("null");
  });

  it("leaves everything alone when the reset is canceled", async () => {
    render(TextInputForm);
    const input = screen.getByRole("textbox", { name: "User" });
    getForm().addEventListener("reset", (event) => event.preventDefault());

    await user.type(input, "eric");
    getForm().reset();
    await flushFormReset();

    expect(input).toHaveValue("eric");
    expect(getBoundText()).toBe("eric");
  });

  it("does not dispatch input on reset", async () => {
    const onInput = vi.fn();
    render(TextInputForm, { props: { onInput } });
    const input = screen.getByRole("textbox", { name: "User" });

    await user.type(input, "e");
    onInput.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(onInput).not.toHaveBeenCalled();
  });
});
