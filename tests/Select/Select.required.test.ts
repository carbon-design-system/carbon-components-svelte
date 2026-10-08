import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import Select from "./Select.required.test.svelte";

describe("Select required", () => {
  it("shows the invalid state instead of the browser bubble", async () => {
    render(Select);
    const select = screen.getByRole("combobox");
    let cancelled = false;
    select.addEventListener("invalid", (e) => {
      cancelled = e.defaultPrevented;
    });

    expect(getForm().reportValidity()).toBe(false);
    await tick();

    expect(cancelled).toBe(true);
    expect(screen.getByText("Select an option")).toBeInTheDocument();
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveFocus();
  });

  it("clears the state once an option with a value is selected", async () => {
    render(Select);
    getForm().reportValidity();
    await tick();

    await user.selectOptions(screen.getByRole("combobox"), "m");

    expect(screen.queryByText("Select an option")).toBeNull();
  });
});
