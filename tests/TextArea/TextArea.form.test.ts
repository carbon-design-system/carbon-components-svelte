import { render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { nextFrame } from "../utils/next-frame";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import TextAreaForm from "./TextArea.form.test.svelte";

describe("TextArea form reset", () => {
  it("syncs the bound value and counter to the cleared field", async () => {
    render(TextAreaForm, { props: { value: "hi", maxCount: 20 } });
    const textarea = screen.getByRole("textbox", { name: "Bio" });

    await user.type(textarea, " there");
    expect(textarea).toHaveValue("hi there");
    expect(screen.getByText("8/20")).toBeInTheDocument();

    await resetForm();

    expect(textarea).toHaveValue("");
    expect(getBoundText()).toBe("");
    expect(screen.getByText("0/20")).toBeInTheDocument();
    expect(new FormData(getForm()).get("bio")).toBe("");
  });

  it("resets a null value to an empty string", async () => {
    render(TextAreaForm, { props: { value: null } });
    const textarea = screen.getByRole("textbox", { name: "Bio" });

    await user.type(textarea, "x");
    await resetForm();

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
    await nextFrame();
    expect(textarea.style.height).toBe("120px");

    textarea.defaultValue = "hi";
    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      value: 42,
    });
    await resetForm();
    await nextFrame();

    expect(textarea.style.height).toBe("42px");
    expect(textarea).toHaveValue("hi");
  });
});
