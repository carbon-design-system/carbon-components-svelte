import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ProfileMenuSelect from "./ProfileMenuSelect.test.svelte";

const trigger = () => screen.getByRole("button", { name: "Profile" });

describe("ProfileMenuItem closes its ProfileMenu", () => {
  it('closes with trigger "select" and returns focus to the trigger', async () => {
    const onClose = vi.fn();
    render(ProfileMenuSelect, { props: { onClose } });

    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    screen.getByRole("button", { name: "Log out" }).focus();
    await user.keyboard("{Enter}");
    await tick();

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
  });

  it("closes when an anchor is activated", async () => {
    const onClose = vi.fn();
    render(ProfileMenuSelect, { props: { onClose } });

    await user.click(trigger());
    await user.click(screen.getByRole("link", { name: "Settings" }));

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
  });

  it("stays open when the click handler calls preventDefault", async () => {
    const onClose = vi.fn();
    render(ProfileMenuSelect, { props: { onClose } });

    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Stay open" }));

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does nothing for an item outside any menu", async () => {
    const onClose = vi.fn();
    render(ProfileMenuSelect, { props: { onClose } });

    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Outside any menu" }));

    // Only the outside click closed the menu, not a select.
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });
});
