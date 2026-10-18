import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ProfileMenu from "./ProfileMenu.test.svelte";

describe("ProfileMenu", () => {
  const getTrigger = () => screen.getByRole("button", { name: "Profile" });

  it("is a disclosure that controls its panel, not a menu button", async () => {
    render(ProfileMenu);

    // aria-haspopup="true" means "menu", which the panel is not.
    expect(getTrigger()).not.toHaveAttribute("aria-haspopup");
    expect(getTrigger()).not.toHaveAttribute("aria-controls");

    await user.click(getTrigger());
    const panel = document.getElementById(
      getTrigger().getAttribute("aria-controls") ?? "",
    );
    expect(panel).toHaveClass("bx--profile-menu");
  });

  it("names the panel from the trigger's iconDescription", async () => {
    render(ProfileMenu);

    await user.click(getTrigger());

    expect(
      screen.getByText("Settings").closest(".bx--profile-menu"),
    ).toHaveAttribute("aria-label", "Profile");
  });

  it("renders a default UserAvatar when no avatar slot is provided", async () => {
    render(ProfileMenu);

    expect(getTrigger().querySelector(".bx--user-avatar")).toBeInTheDocument();

    await user.click(getTrigger());
    const header = screen.getByText("Sadek Bazaraa").closest("a");
    expect(header?.querySelector(".bx--user-avatar")).toBeInTheDocument();
  });

  it("opens and closes from the trigger", async () => {
    render(ProfileMenu);

    expect(getTrigger()).toHaveAttribute("aria-expanded", "false");
    await user.click(getTrigger());
    expect(getTrigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Settings")).toBeInTheDocument();

    await user.click(getTrigger());
    expect(getTrigger()).toHaveAttribute("aria-expanded", "false");
  });

  describe("outside click", () => {
    it("respects preventCloseOnClickOutside", async () => {
      render(ProfileMenu, { props: { preventCloseOnClickOutside: true } });

      await user.click(getTrigger());
      await user.click(document.body);

      expect(getTrigger()).toHaveAttribute("aria-expanded", "true");
    });
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    render(ProfileMenu);
    const trigger = getTrigger();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });
});
