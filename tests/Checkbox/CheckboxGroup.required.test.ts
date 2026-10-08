import { render, screen } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import CheckboxFormGroup from "./Checkbox.formGroup.test.svelte";

describe("CheckboxGroup required", () => {
  it("requires at least one checkbox, not every checkbox", async () => {
    render(CheckboxFormGroup, {
      props: { mode: "checkbox-group", required: true },
    });

    expect(getForm().checkValidity()).toBe(false);

    await user.click(screen.getByRole("checkbox", { name: "A" }));

    expect(getForm().checkValidity()).toBe(true);
    expect(screen.getByRole("checkbox", { name: "B" })).not.toBeRequired();
  });
});
