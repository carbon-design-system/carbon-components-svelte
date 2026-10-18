import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderPanelFocusReturn from "./HeaderPanelFocusReturn.test.svelte";

describe("header panels return focus when an item closes them", () => {
  // ProfileMenu and HeaderSwitcher close through `select()`, which
  // HeaderPanelHost.test.ts covers. Only HeaderAction closes by consumer.
  it("returns focus to the HeaderAction trigger when a consumer closes it", async () => {
    render(HeaderPanelFocusReturn, { props: { actionOpen: true } });

    screen.getByRole("button", { name: "Dismiss all" }).focus();
    await user.keyboard("{Enter}");
    await tick();

    const trigger = screen.getByRole("button", { name: "Notifications" });
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
