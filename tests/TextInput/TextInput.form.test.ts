import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import TextInputForm from "./TextInput.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;
/** The reset sync runs on the next task. */
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe("TextInput form reset", () => {
  it("syncs the bound value to the cleared field", async () => {
    render(TextInputForm);
    const input = screen.getByRole("textbox", { name: "User" });

    await user.type(input, "eric");
    expect(getBound()).toBe("eric");

    getForm().reset();
    await flush();

    expect(input).toHaveValue("");
    expect(getBound()).toBe("");
    expect(new FormData(getForm()).get("user")).toBe("");
  });

  it("clears a value set on the client, like the browser does", async () => {
    render(TextInputForm, { props: { value: "ada" } });
    const input = screen.getByRole("textbox", { name: "User" });

    await user.type(input, "x");
    getForm().reset();
    await flush();

    expect(input).toHaveValue("");
    expect(getBound()).toBe("");
  });

  it("follows the field's default value, as with server-rendered markup", async () => {
    render(TextInputForm, { props: { value: "ada" } });
    const input = screen.getByRole("textbox", {
      name: "User",
    }) as HTMLInputElement;
    // Server-rendered markup carries the value as the `value` attribute.
    input.defaultValue = "ada";

    await user.type(input, "x");
    expect(getBound()).toBe("adax");

    getForm().reset();
    await flush();

    expect(input).toHaveValue("ada");
    expect(getBound()).toBe("ada");
  });

  it("parses a number field", async () => {
    render(TextInputForm, { props: { type: "number", value: 5 } });
    const input = screen.getByRole("spinbutton", {
      name: "User",
    }) as HTMLInputElement;
    input.defaultValue = "5";

    await user.type(input, "7");
    expect(getBound()).toBe("57");

    getForm().reset();
    await flush();

    expect(input).toHaveValue(5);
    expect(getBound()).toBe("5");
  });

  it("sets an emptied number field to null", async () => {
    render(TextInputForm, { props: { type: "number" } });
    const input = screen.getByRole("spinbutton", { name: "User" });

    await user.type(input, "7");
    getForm().reset();
    await flush();

    expect(getBound()).toBe("null");
  });

  it("leaves everything alone when the reset is canceled", async () => {
    render(TextInputForm);
    const input = screen.getByRole("textbox", { name: "User" });
    getForm().addEventListener("reset", (event) => event.preventDefault());

    await user.type(input, "eric");
    getForm().reset();
    await flush();

    expect(input).toHaveValue("eric");
    expect(getBound()).toBe("eric");
  });

  it("does not dispatch input on reset", async () => {
    const onInput = vi.fn();
    render(TextInputForm, { props: { onInput } });
    const input = screen.getByRole("textbox", { name: "User" });

    await user.type(input, "e");
    onInput.mockClear();

    getForm().reset();
    await flush();

    expect(onInput).not.toHaveBeenCalled();
  });
});
