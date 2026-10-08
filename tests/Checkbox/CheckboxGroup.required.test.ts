import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import CheckboxFormGroup from "./Checkbox.formGroup.test.svelte";
import CheckboxRequired from "./Checkbox.required.test.svelte";

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

describe("CheckboxGroup required invalid state", () => {
  it("shows the group's invalid state instead of the browser bubble", async () => {
    render(CheckboxFormGroup, {
      props: { mode: "checkbox-group", required: true },
    });
    const invalidEvents: Event[] = [];
    getForm().addEventListener("invalid", (e) => invalidEvents.push(e), true);

    getForm().reportValidity();
    await tick();

    expect(invalidEvents.length).toBeGreaterThan(0);
    expect(invalidEvents.every((e) => e.defaultPrevented)).toBe(true);
    expect(screen.getAllByText("Select at least one option")).toHaveLength(1);
    expect(screen.getByRole("checkbox", { name: "A" })).toHaveFocus();

    await user.click(screen.getByRole("checkbox", { name: "B" }));
    expect(screen.queryByText("Select at least one option")).toBeNull();
  });
});

describe("Checkbox required invalid state", () => {
  it("shows the checkbox's invalid state instead of the browser bubble", async () => {
    render(CheckboxRequired);
    const checkbox = screen.getByRole("checkbox");
    let cancelled = false;
    checkbox.addEventListener("invalid", (e) => {
      cancelled = e.defaultPrevented;
    });

    getForm().reportValidity();
    await tick();

    expect(cancelled).toBe(true);
    expect(screen.getByText("Check this box to continue")).toBeInTheDocument();
    expect(checkbox).toHaveFocus();

    await user.click(checkbox);
    expect(screen.queryByText("Check this box to continue")).toBeNull();
  });
});
