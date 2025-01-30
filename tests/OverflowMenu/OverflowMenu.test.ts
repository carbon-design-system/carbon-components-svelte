import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import OverflowMenu from "./OverflowMenu.test.svelte";

describe("OverflowMenu", () => {
  it("renders and functions correctly", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    expect(menuButton).toHaveAttribute("aria-haspopup", "true");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(3);
    expect(menuItems[0]).toHaveFocus();

    expect(menuItems[0]).toHaveTextContent("Manage credentials");
    expect(menuItems[1]).toHaveTextContent("API documentation");
    expect(menuItems[2]).toHaveTextContent("Delete service");

    expect(menuItems[1]).toHaveAttribute(
      "href",
      "https://cloud.ibm.com/docs/api-gateway/",
    );

    expect(menuItems[2].parentElement).toHaveClass(
      "bx--overflow-menu-options__option--danger",
    );

    const spy = vi.spyOn(console, "log");
    await user.click(menuItems[0]);
    expect(spy).toHaveBeenCalledWith("click", "Manage credentials");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(spy).toHaveBeenCalledWith("close", {
      index: 0,
      text: "Manage credentials",
    });
  });

  it("handles keyboard navigation", async () => {
    render(OverflowMenu);

    const spy = vi.spyOn(console, "log");

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    let menuItems = screen.getAllByRole("menuitem");
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(menuItems[1]).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(spy).toHaveBeenCalledWith("click", "API documentation");

    await user.click(menuButton);
    menuItems = screen.getAllByRole("menuitem");
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(menuItems[2]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(spy).toHaveBeenCalledWith("close", null);
  });

  it("closes when clicking outside", async () => {
    render(OverflowMenu);

    const menuButton = screen.getByRole("button");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.click(document.body);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });
});
