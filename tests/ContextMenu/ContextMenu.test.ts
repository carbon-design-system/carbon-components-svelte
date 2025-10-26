import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ContextMenu from "./ContextMenu.test.svelte";

describe("ContextMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    render(ContextMenu);

    const target = screen.getByTestId("target");
    expect(target).toBeInTheDocument();
    expect(target).toHaveTextContent("Right click me");

    const menu = screen.getAllByRole("menu");
    expect(menu[0]).toBeInTheDocument();
    expect(menu[0]).toHaveClass("bx--menu");
  });

  it("should render menu options", () => {
    render(ContextMenu);

    const options = screen.getAllByRole("menuitem");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("Option 1");
    expect(options[1]).toHaveTextContent("Option 2");
  });

  it("should open on right click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu);

    const target = screen.getByTestId("target");
    await user.pointer({ target, keys: "[MouseRight]" });
    expect(consoleLog).toHaveBeenCalledWith("open", expect.any(HTMLElement));
  });

  it("should close on escape key", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu, { props: { open: true } });

    await user.keyboard("{Escape}");
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should close on click outside", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu, { props: { open: true } });

    await user.click(document.body);
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("should handle keyboard navigation", async () => {
    render(ContextMenu, { props: { open: true } });

    const menu = screen.getAllByRole("menu")[0];
    menu.focus();

    // Arrow down
    await user.keyboard("{ArrowDown}");
    const options = screen.getAllByRole("menuitem");
    expect(options[0].parentElement).toHaveFocus();

    // Arrow up
    await user.keyboard("{ArrowUp}");
    expect(options[1].parentElement).toHaveFocus();
  });

  it("should handle custom target", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu);

    const target = screen.getByTestId("target");
    await user.pointer({ target, keys: "[MouseRight]" });
    expect(consoleLog).toHaveBeenCalledWith("open", target);
  });

  it("should handle custom position", () => {
    render(ContextMenu, {
      props: {
        open: true,
        x: 100,
        y: 200,
      },
    });

    const menu = screen.getAllByRole("menu")[0];
    expect(menu).toHaveStyle({
      left: "100px",
      top: "200px",
    });
  });

  it("should handle nested menus", async () => {
    render(ContextMenu, { props: { open: true } });

    const menus = screen.getAllByRole("menu");
    expect(menus[0]).toHaveAttribute("data-level", "1");

    // Simulate nested menu
    const nestedMenu = document.createElement("ul");
    nestedMenu.setAttribute("data-level", "2");
    menus[0].appendChild(nestedMenu);
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1848
  it("should not close parent menu when clicking submenu trigger", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        x: 100,
        y: 100,
      },
    });

    const submenuTrigger = screen.getByText("Option with submenu");
    expect(submenuTrigger).toBeInTheDocument();

    await user.click(submenuTrigger);

    expect(consoleLog).not.toHaveBeenCalledWith("close");

    const submenuOptions = screen.getByText("Submenu option 1");
    expect(submenuOptions).toBeInTheDocument();
  });

  it("should close menu when clicking regular option", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenu, {
      props: {
        open: true,
        x: 100,
        y: 100,
      },
    });

    // Click a regular option
    const option = screen.getByText("Option 1");
    await user.click(option);

    // Menu should close
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1847
  it("should position submenu to the left when it would overflow right viewport edge", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 400,
    });

    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        x: 300,
        y: 100,
      },
    });

    const submenuTrigger = screen.getByText("Option with submenu");
    await user.hover(submenuTrigger);

    const submenu = screen
      .getAllByRole("menu")
      .find((menu) => menu.getAttribute("data-level") === "2");
    assert(submenu);

    const submenuX = parseInt(submenu.style.left, 10);
    const submenuWidth = submenu.getBoundingClientRect().width;

    // Submenu should not overflow the right edge of viewport
    expect(submenuX + submenuWidth).toBeLessThanOrEqual(400);
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1847
  it("should position submenu to the right when there is sufficient space", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        x: 100,
        y: 100,
      },
    });

    const submenuTrigger = screen.getByText("Option with submenu");
    await user.hover(submenuTrigger);
    await new Promise((resolve) => setTimeout(resolve, 150));

    const submenu = screen
      .getAllByRole("menu")
      .find((menu) => menu.getAttribute("data-level") === "2");
    assert(submenu);

    const rootMenu = screen
      .getAllByRole("menu")
      .find((menu) => menu.getAttribute("data-level") === "1");
    assert(rootMenu);

    const rootX = parseInt(rootMenu.style.left, 10);
    const rootWidth = rootMenu.getBoundingClientRect().width;
    const submenuX = parseInt(submenu.style.left, 10);

    // Submenu should be positioned to the right of the parent menu.
    expect(submenuX).toBeGreaterThanOrEqual(rootX + rootWidth);
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1847
  it("should constrain submenu to viewport when it would overflow both sides", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 200,
    });

    render(ContextMenu, {
      props: {
        open: true,
        withSubmenu: true,
        x: 100,
        y: 100,
      },
    });

    const submenuTrigger = screen.getByText("Option with submenu");
    await user.hover(submenuTrigger);

    const submenu = screen
      .getAllByRole("menu")
      .find((menu) => menu.getAttribute("data-level") === "2");
    assert(submenu);

    const submenuX = parseInt(submenu.style.left, 10);
    // Submenu should be positioned at or near 0 (left edge of viewport).
    expect(submenuX).toBeGreaterThanOrEqual(0);
  });
});
