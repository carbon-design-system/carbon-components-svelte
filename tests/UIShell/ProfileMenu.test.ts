import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ProfileMenu from "./ProfileMenu.test.svelte";

describe("ProfileMenu", () => {
  const getTrigger = () => screen.getByRole("button", { name: "Profile" });

  it("renders the trigger and is closed by default", () => {
    render(ProfileMenu);

    expect(getTrigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });

  it("opens and closes from the trigger", async () => {
    render(ProfileMenu);

    await user.click(getTrigger());
    expect(getTrigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Settings")).toBeInTheDocument();

    await user.click(getTrigger());
    expect(getTrigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("renders header, detail, and item rows when open", async () => {
    render(ProfileMenu);

    await user.click(getTrigger());

    const header = screen.getByText("Richard Hendricks").closest("a");
    expect(header).toHaveAttribute("href", "/profile");
    expect(screen.getByText("rhendricks")).toBeInTheDocument();
    expect(screen.getByText("View profile")).toBeInTheDocument();

    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upgrade" })).toHaveAttribute(
      "href",
      "/upgrade",
    );

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("associates the detail value with its label for screen readers", async () => {
    render(ProfileMenu);

    await user.click(getTrigger());
    const value = screen.getByText("Lite");
    const labelId = value.getAttribute("aria-labelledby");

    expect(labelId).toBeTruthy();
    expect(screen.getByText("Plan")).toHaveAttribute("id", labelId as string);
  });

  it("renders an action item as a button and forwards on:click", async () => {
    render(ProfileMenu);

    await user.click(getTrigger());
    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(screen.getByTestId("logout-count")).toHaveTextContent("1");
    expect(getTrigger()).toHaveAttribute("aria-expanded", "true");
  });

  describe("outside click", () => {
    it("closes when clicking outside", async () => {
      render(ProfileMenu);

      await user.click(getTrigger());
      await user.click(document.body);

      expect(getTrigger()).toHaveAttribute("aria-expanded", "false");
    });

    it("stays open when clicking inside the menu", async () => {
      render(ProfileMenu);

      await user.click(getTrigger());
      await user.click(screen.getByText("Plan"));

      expect(getTrigger()).toHaveAttribute("aria-expanded", "true");
    });

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
