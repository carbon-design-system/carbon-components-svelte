import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import CopyInput from "../../src/CopyInput/CopyInput.svelte";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import CopyInputForm from "./CopyInput.form.test.svelte";

describe("CopyInput form reset", () => {
  it("keeps the value, since the field is read-only", async () => {
    render(CopyInputForm);
    const input = screen.getByRole("textbox");

    await resetForm();

    expect(input).toHaveValue("a1b2c3d4");
    expect(new FormData(getForm()).get("apiKey")).toBe("a1b2c3d4");
  });

  it("keeps a value set after mount", async () => {
    const { component } = render(CopyInputForm);

    component.value = "rotated-key";
    await tick();
    await resetForm();

    expect(screen.getByRole("textbox")).toHaveValue("rotated-key");
  });

  it("submits the value, not the mask, and keeps both after reset", async () => {
    render(CopyInputForm, { props: { maskedValue: "a1b2••••" } });
    const input = screen.getByRole("textbox");

    await resetForm();

    expect(input).toHaveValue("a1b2••••");
    expect(new FormData(getForm()).getAll("apiKey")).toEqual(["a1b2c3d4"]);
  });

  it("submits a masked value to the form it names", () => {
    const { container } = render(CopyInput, {
      props: {
        labelText: "API key",
        name: "apiKey",
        value: "a1b2c3d4",
        maskedValue: "a1b2••••",
        form: "settings",
      },
    });

    expect(container.querySelector("input[type=hidden]")).toHaveAttribute(
      "form",
      "settings",
    );
  });
});
