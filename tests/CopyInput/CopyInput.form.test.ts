import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
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
});
