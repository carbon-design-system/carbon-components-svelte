import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ProfileMenu from "./ProfileMenu.test.svelte";
import ProfileMenuHeader from "./ProfileMenuHeader.test.svelte";
import ProfileMenuItem from "./ProfileMenuItem.test.svelte";
import ProfileMenuKeyboard from "./ProfileMenuKeyboard.test.svelte";

describe("ProfileMenu", () => {
  const getTrigger = () => screen.getByRole("button", { name: "Profile" });

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

describe("ProfileMenuHeader", () => {
  it("renders the view-profile text, customizable and optional", () => {
    render(ProfileMenuHeader);

    expect(
      screen.getByTestId("default").querySelector(".bx--profile-menu__view"),
    ).toHaveTextContent("View profile");
    expect(
      screen.getByTestId("custom").querySelector(".bx--profile-menu__view"),
    ).toHaveTextContent("Manage account");
    expect(
      screen.getByTestId("hidden").querySelector(".bx--profile-menu__view"),
    ).toBeNull();
  });
});

describe("ProfileMenuItem", () => {
  it("renders the icon prop, omitting the icon when unset", () => {
    render(ProfileMenuItem);

    const withIcon = screen.getByTestId("with-icon");
    expect(withIcon.querySelector("svg")).toBeInTheDocument();

    const noIcon = screen.getByTestId("no-icon");
    expect(noIcon.querySelector("svg")).toBeNull();
  });
});

const item = (name: string) =>
  screen.getByRole(name === "Settings" ? "link" : "button", { name });

describe("ProfileMenu item keyboard navigation", () => {
  it("moves with ArrowDown and ArrowUp, wrapping at the ends", async () => {
    render(ProfileMenuKeyboard);

    item("Settings").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("Log out")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(item("Settings")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(item("Log out")).toHaveFocus();
  });

  it("navigates within a HeaderSwitcher without leaving it", async () => {
    render(ProfileMenuKeyboard);

    item("Acme Corp").focus();
    await user.keyboard("{ArrowUp}");
    expect(item("Initech")).toHaveFocus();
    await user.keyboard("{Home}{ArrowDown}");
    expect(item("Globex")).toHaveFocus();
  });
});
