import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import TabsVerticalNavigation from "./TabsVerticalNavigation.test.svelte";

describe("TabsVertical navigation", () => {
  it("renders labelled navigation links instead of a tab list", async () => {
    render(TabsVerticalNavigation);
    await tick();

    const nav = screen.getByRole("navigation", { name: "Settings" });
    const list = nav.querySelector("ul");
    expect(list).not.toHaveAttribute("role");
    expect(list).not.toHaveAttribute("aria-orientation");
    expect(screen.queryAllByRole("tab")).toHaveLength(0);

    const profile = screen.getByRole("link", { name: "Profile" });
    const security = screen.getByRole("link", { name: "Security" });
    expect(profile).toHaveAttribute("aria-current", "page");
    expect(security).not.toHaveAttribute("aria-current");
    for (const link of [profile, security]) {
      expect(link).not.toHaveAttribute("aria-selected");
      expect(link).not.toHaveAttribute("tabindex");
    }
    expect(screen.getByText("Billing").closest("a")).not.toHaveAttribute(
      "href",
    );
    expect(screen.getByTestId("page")).toHaveTextContent("Page 0");
  });

  it("follows the link on click and moves aria-current", async () => {
    render(TabsVerticalNavigation);
    await tick();

    const security = screen.getByRole("link", { name: "Security" });
    expect(await fireEvent.click(security)).toBe(true);
    await tick();

    expect(security).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("page")).toHaveTextContent("Page 1");
  });

  it("leaves arrow keys to the browser", async () => {
    render(TabsVerticalNavigation);
    await tick();

    const profile = screen.getByRole("link", { name: "Profile" });
    profile.focus();
    expect(await fireEvent.keyDown(profile, { key: "ArrowDown" })).toBe(true);
    await tick();

    expect(profile).toHaveFocus();
    expect(screen.getByTestId("page")).toHaveTextContent("Page 0");
  });
});
