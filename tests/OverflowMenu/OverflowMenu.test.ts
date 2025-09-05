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

  it("uses CSS custom properties for performance optimization", async () => {
    const { container } = render(OverflowMenu);

    const styleTags = document.querySelectorAll("style");
    const initialStyleCount = styleTags.length;
    expect(styleTags.length).toBe(initialStyleCount);

    await user.click(screen.getByRole("button"));
    expect(container.querySelector(".bx--overflow-menu-options")).toHaveStyle(
      "--overflow-menu-options-after-width: 2rem",
    );
    expect(styleTags.length).toBe(initialStyleCount);
  });

  it("stress test: multiple instances don't create individual style tags", async () => {
    const { container: container1 } = render(OverflowMenu);
    const { container: container2 } = render(OverflowMenu);
    const { container: container3 } = render(OverflowMenu);

    const styleTagsBefore = document.querySelectorAll("style").length;
    const menuButtons1 = container1.querySelectorAll("button");
    const menuButtons2 = container2.querySelectorAll("button");
    const menuButtons3 = container3.querySelectorAll("button");

    await user.click(menuButtons1[0]);
    await user.click(menuButtons2[0]);
    await user.click(menuButtons3[0]);

    const styleTagsAfter = document.querySelectorAll("style").length;

    // Verify no additional style tags created (old approach would create 3+)
    expect(styleTagsAfter).toBe(styleTagsBefore);

    // Verify all menus have CSS custom property set.
    const allMenus = [
      ...container1.querySelectorAll(".bx--overflow-menu-options"),
      ...container2.querySelectorAll(".bx--overflow-menu-options"),
      ...container3.querySelectorAll(".bx--overflow-menu-options"),
    ];

    expect(allMenus.length).toBeGreaterThan(0);
    allMenus.forEach((menu) => {
      expect(menu).toHaveStyle("--overflow-menu-options-after-width: 2rem");
    });
  });
});
