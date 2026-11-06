import { render, screen } from "@testing-library/svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { user } from "../utils/user";
import PopoverFocusReturn from "./PopoverFocusReturn.test.svelte";

describe("Popover focus return", () => {
  it("goes back to the control that opened it when Escape closes it from inside", async () => {
    render(PopoverFocusReturn);
    const toggle = screen.getByRole("button", { name: "Toggle" });
    await user.click(toggle);
    await flushDismiss();
    screen.getByRole("button", { name: "Inside" }).focus();

    await user.keyboard("{Escape}");
    await flushDismiss();

    expect(toggle).toHaveFocus();
  });

  it("leaves focus where it is when the popover closes with focus outside it", async () => {
    render(PopoverFocusReturn);
    const toggle = screen.getByRole("button", { name: "Toggle" });
    await user.click(toggle);
    await flushDismiss();
    toggle.focus();

    await user.keyboard("{Escape}");
    await flushDismiss();

    expect(toggle).toHaveFocus();
    expect(document.querySelector(".bx--popover--open")).toBeNull();
  });
});
