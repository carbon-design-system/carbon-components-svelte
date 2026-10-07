import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderPanelFocusReturn from "./HeaderPanelFocusReturn.test.svelte";

describe("header panels return focus when an item closes them", () => {
  it.each([
    ["ProfileMenu", { profileOpen: true }, "Profile", "Log out"],
    ["HeaderSwitcher", { switcherOpen: true }, "Switch account", "Globex"],
    ["HeaderAction", { actionOpen: true }, "Notifications", "Dismiss all"],
  ])("%s", async (_, props, triggerName, itemName) => {
    render(HeaderPanelFocusReturn, { props });

    screen.getByRole("button", { name: itemName }).focus();
    await user.keyboard("{Enter}");
    await tick();

    const trigger = screen.getByRole("button", { name: triggerName });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("does not move focus to the trigger on an outside click", async () => {
    render(HeaderPanelFocusReturn, { props: { profileOpen: true } });

    screen.getByRole("button", { name: "Log out" }).focus();
    await user.click(screen.getByText("Not focusable"));
    await tick();

    expect(screen.getByRole("button", { name: "Profile" })).not.toHaveFocus();
  });
});
