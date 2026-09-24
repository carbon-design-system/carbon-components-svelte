import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import TextAreaForm from "./TextArea.form.test.svelte";

describe("TextArea form reset", () => {
  it("syncs the bound value and counter to the cleared field", async () => {
    render(TextAreaForm, { props: { value: "hi", maxCount: 20 } });
    const textarea = screen.getByRole("textbox", { name: "Bio" });

    await user.type(textarea, " there");
    expect(textarea).toHaveValue("hi there");
    expect(screen.getByText("8/20")).toBeInTheDocument();

    getForm().reset();
    await flushFormReset();

    expect(textarea).toHaveValue("");
    expect(getBoundText()).toBe("");
    expect(screen.getByText("0/20")).toBeInTheDocument();
    expect(new FormData(getForm()).get("bio")).toBe("");
  });

  it("clears a value set on the client with no interaction, like the browser does", async () => {
    render(TextAreaForm, { props: { value: "hi" } });
    const textarea = screen.getByRole("textbox", { name: "Bio" });

    getForm().reset();
    await flushFormReset();

    expect(textarea).toHaveValue("");
    expect(getBoundText()).toBe("");
  });

  it("follows the field's default value, as with server-rendered markup", async () => {
    render(TextAreaForm, { props: { value: "hi", maxCount: 20 } });
    const textarea = screen.getByRole("textbox", {
      name: "Bio",
    });
    assert(textarea instanceof HTMLTextAreaElement);
    // Server-rendered markup carries the value as the textarea's content.
    textarea.defaultValue = "hi";

    await user.type(textarea, " there");
    expect(getBoundText()).toBe("hi there");

    getForm().reset();
    await flushFormReset();

    expect(textarea).toHaveValue("hi");
    expect(getBoundText()).toBe("hi");
    expect(screen.getByText("2/20")).toBeInTheDocument();
  });

  it("resets a null value to an empty string", async () => {
    render(TextAreaForm, { props: { value: null } });
    const textarea = screen.getByRole("textbox", { name: "Bio" });

    await user.type(textarea, "x");
    getForm().reset();
    await flushFormReset();

    expect(textarea).toHaveValue("");
    expect(getBoundText()).toBe("");
  });

  it("reruns the auto-resize after a reset", async () => {
    render(TextAreaForm, { props: { grow: true } });
    const textarea = screen.getByRole("textbox", {
      name: "Bio",
    });
    assert(textarea instanceof HTMLTextAreaElement);

    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      value: 120,
    });
    await user.type(textarea, "line one{enter}line two");
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(textarea.style.height).toBe("120px");

    textarea.defaultValue = "hi";
    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      value: 42,
    });
    getForm().reset();
    await flushFormReset();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(textarea.style.height).toBe("42px");
    expect(textarea).toHaveValue("hi");
  });

  it("leaves everything alone when the reset is canceled", async () => {
    render(TextAreaForm);
    const textarea = screen.getByRole("textbox", { name: "Bio" });
    getForm().addEventListener("reset", (event) => event.preventDefault());

    await user.type(textarea, "eric");
    getForm().reset();
    await flushFormReset();

    expect(textarea).toHaveValue("eric");
    expect(getBoundText()).toBe("eric");
  });

  it("does not dispatch input or change on reset", async () => {
    const onInput = vi.fn();
    const onChange = vi.fn();
    render(TextAreaForm, { props: { onInput, onChange } });
    const textarea = screen.getByRole("textbox", { name: "Bio" });

    await user.type(textarea, "e");
    onInput.mockClear();
    onChange.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(onInput).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
