import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import TextAreaForm from "./TextArea.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;
/** The reset sync runs on the next task. */
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe("TextArea form reset", () => {
  it("syncs the bound value and counter to the cleared field", async () => {
    render(TextAreaForm, { props: { value: "hi", maxCount: 20 } });
    const textarea = screen.getByRole("textbox", { name: "Bio" });

    await user.type(textarea, " there");
    expect(textarea).toHaveValue("hi there");
    expect(screen.getByText("8/20")).toBeInTheDocument();

    getForm().reset();
    await flush();

    expect(textarea).toHaveValue("");
    expect(getBound()).toBe("");
    expect(screen.getByText("0/20")).toBeInTheDocument();
    expect(new FormData(getForm()).get("bio")).toBe("");
  });

  it("clears a value set on the client with no interaction, like the browser does", async () => {
    render(TextAreaForm, { props: { value: "hi" } });
    const textarea = screen.getByRole("textbox", { name: "Bio" });

    getForm().reset();
    await flush();

    expect(textarea).toHaveValue("");
    expect(getBound()).toBe("");
  });

  it("follows the field's default value, as with server-rendered markup", async () => {
    render(TextAreaForm, { props: { value: "hi", maxCount: 20 } });
    const textarea = screen.getByRole("textbox", {
      name: "Bio",
    }) as HTMLTextAreaElement;
    // Server-rendered markup carries the value as the textarea's content.
    textarea.defaultValue = "hi";

    await user.type(textarea, " there");
    expect(getBound()).toBe("hi there");

    getForm().reset();
    await flush();

    expect(textarea).toHaveValue("hi");
    expect(getBound()).toBe("hi");
    expect(screen.getByText("2/20")).toBeInTheDocument();
  });

  it("resets a null value to an empty string", async () => {
    render(TextAreaForm, { props: { value: null } });
    const textarea = screen.getByRole("textbox", { name: "Bio" });

    await user.type(textarea, "x");
    getForm().reset();
    await flush();

    expect(textarea).toHaveValue("");
    expect(getBound()).toBe("");
  });

  it("reruns the auto-resize after a reset", async () => {
    render(TextAreaForm, { props: { grow: true } });
    const textarea = screen.getByRole("textbox", {
      name: "Bio",
    }) as HTMLTextAreaElement;

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
    await flush();
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
    await flush();

    expect(textarea).toHaveValue("eric");
    expect(getBound()).toBe("eric");
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
    await flush();

    expect(onInput).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
