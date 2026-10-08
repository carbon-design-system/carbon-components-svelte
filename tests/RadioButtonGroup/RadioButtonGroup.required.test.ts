import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import RadioButtonGroup from "./RadioButtonGroup.form.test.svelte";

describe("RadioButtonGroup required", () => {
  it("shows the group's invalid state instead of the browser bubble", async () => {
    render(RadioButtonGroup, { props: { required: true } });
    const invalidEvents: Event[] = [];
    getForm().addEventListener("invalid", (e) => invalidEvents.push(e), true);

    expect(getForm().reportValidity()).toBe(false);
    await tick();

    expect(invalidEvents.every((e) => e.defaultPrevented)).toBe(true);
    expect(screen.getByText("Select an option")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("radio", { name: "A" })).toHaveFocus();
  });

  it("clears the state on selection and on form reset", async () => {
    render(RadioButtonGroup, { props: { required: true } });
    getForm().reportValidity();
    await tick();

    await user.click(screen.getByRole("radio", { name: "B" }));
    expect(screen.queryByText("Select an option")).toBeNull();

    getForm().reset();
    await flushFormReset();
    getForm().reportValidity();
    await tick();
    expect(screen.getByText("Select an option")).toBeInTheDocument();

    getForm().reset();
    await flushFormReset();
    expect(screen.queryByText("Select an option")).toBeNull();
  });
});
