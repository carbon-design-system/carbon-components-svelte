import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { attemptSubmit } from "../utils/attempt-submit";
import { user } from "../utils/user";
import CheckboxRequired from "./Checkbox.required.test.svelte";

describe("Checkbox required invalid state", () => {
  it("shows the checkbox's invalid state instead of the browser bubble", async () => {
    render(CheckboxRequired);
    const checkbox = screen.getByRole("checkbox");
    let cancelled = false;
    checkbox.addEventListener("invalid", (e) => {
      cancelled = e.defaultPrevented;
    });

    expect(await attemptSubmit()).toBe(false);
    await tick();

    expect(cancelled).toBe(true);
    expect(checkbox).toBeRequired();
    expect(screen.getByText("Check this box to continue")).toBeInTheDocument();
    expect(checkbox).toHaveFocus();

    await user.click(checkbox);
    expect(screen.queryByText("Check this box to continue")).toBeNull();
  });
});
