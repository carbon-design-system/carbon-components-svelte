import { fireEvent, render, screen } from "@testing-library/svelte";
import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { expectInlineStyle } from "../utils/inline-style";
import { user } from "../utils/user";
import { setViewportWidth } from "../utils/viewport";
import SideNavMenuActive from "./SideNavMenuActive.test.svelte";
import SideNavMenuBadge from "./SideNavMenuBadge.test.svelte";
import SideNavMenuDepth from "./SideNavMenuDepth.test.svelte";
import SideNavMenuEscape from "./SideNavMenuEscape.test.svelte";

describe("SideNavMenu active state", () => {
  const MENUS = ["Level 1", "Level 2", "Level 3", "Sibling"];

  function activeMenus() {
    return MENUS.filter((name) =>
      screen
        .getByRole("button", { name })
        .parentElement?.classList.contains("bx--side-nav__item--active"),
    );
  }

  it("marks every collapsed ancestor of the current item", async () => {
    render(SideNavMenuActive);
    expect(activeMenus()).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Select current" }));
    expect(activeMenus()).toEqual(["Level 1", "Level 2", "Level 3"]);
  });

  it("leaves expanded menus unmarked", async () => {
    render(SideNavMenuActive, { selected: "current" });
    expect(activeMenus()).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Level 3" }));
    await user.click(screen.getByRole("button", { name: "Level 1" }));
    expect(activeMenus()).toEqual(["Level 1", "Level 3"]);
  });

  it.each([
    ["Select other", ["Level 1", "Sibling"]],
    ["Toggle current", []],
  ])("updates after %s", async (button, expected) => {
    render(SideNavMenuActive);
    await user.click(screen.getByRole("button", { name: "Select current" }));
    expect(activeMenus()).toEqual(["Level 1", "Level 2", "Level 3"]);

    await user.click(screen.getByRole("button", { name: button }));
    expect(activeMenus()).toEqual(expected);
  });

  it("marks a menu set to isActive", () => {
    render(SideNavMenuActive);

    expect(
      screen.getByRole("button", { name: "Detail" }).parentElement,
    ).toHaveClass("bx--side-nav__item--active");
  });
});

describe("SideNavMenu badge slot", () => {
  it.each([
    ["badge", true],
    ["no-badge", false],
  ])("%s container has the badge wrapper: %s", (testId, hasBadge) => {
    render(SideNavMenuBadge);
    const container = screen.getByTestId(testId);
    const wrapper = container.querySelector(".bx--side-nav__submenu-badge");

    expect(wrapper !== null).toBe(hasBadge);
    expect(wrapper?.tagName).toBe(hasBadge ? "DIV" : undefined);
    expect(container.querySelector(".bx--badge-indicator") !== null).toBe(
      hasBadge,
    );
  });
});

describe("SideNavMenu nesting depth", () => {
  it.each([
    ["Level 1", "", "", true],
    ["Level 2", "2", "1", false],
    ["Level 3", "3", "2", true],
  ])(
    "sets %s's menu depth to '%s', icon depth to '%s' and icon item class to %s",
    (text, depth, iconDepth, hasIcon) => {
      render(SideNavMenuDepth);

      const button = screen.getByRole("button", { name: text });
      expectInlineStyle(button.nextElementSibling, {
        "--ccs-side-nav-menu-depth": depth,
        "--ccs-side-nav-menu-icon-depth": iconDepth,
      });
      expect(
        button.parentElement?.classList.contains("bx--side-nav__item--icon"),
      ).toBe(hasIcon);
    },
  );
});

describe("SideNavMenu Escape", () => {
  const menu = (name: string) => screen.getByRole("button", { name });

  // Below the breakpoint any Escape closes the open side nav, so each one
  // the menus take must stop there.
  beforeEach(() => {
    setViewportWidth(500);
  });

  afterEach(() => {
    setViewportWidth(1024);
  });

  it("closes the innermost open menu first, then the side nav", async () => {
    const { component } = render(SideNavMenuEscape);
    await flushMacrotask();
    await user.click(menu("Billing"));
    await user.click(menu("Payment methods"));
    screen.getByRole("link", { name: "Cards" }).focus();

    await user.keyboard("{Escape}");
    expect(menu("Payment methods")).toHaveAttribute("aria-expanded", "false");
    expect(menu("Payment methods")).toHaveFocus();
    expect(menu("Billing")).toHaveAttribute("aria-expanded", "true");
    expect(component.isOpen).toBe(true);

    await user.keyboard("{Escape}");
    expect(menu("Billing")).toHaveAttribute("aria-expanded", "false");
    expect(menu("Billing")).toHaveFocus();
    expect(component.isOpen).toBe(true);

    await user.keyboard("{Escape}");
    expect(component.isOpen).toBe(false);
  });

  it.each([
    ["isComposing", { isComposing: true }],
    ["keyCode 229", { keyCode: 229 }],
  ])("ignores Escape while an IME is composing (%s)", async (_, init) => {
    render(SideNavMenuEscape);
    await flushMacrotask();
    await user.click(menu("Billing"));
    const invoices = screen.getByRole("link", { name: "Invoices" });

    await fireEvent.keyDown(invoices, { key: "Escape", ...init });

    expect(menu("Billing")).toHaveAttribute("aria-expanded", "true");
  });
});

describe("SideNavMenuItem", () => {
  it("applies the current-page styling class when isSelected", () => {
    render(SideNavMenuItem, {
      props: { href: "/", text: "Overview", isSelected: true },
    });

    const link = screen.getByRole("link", { name: "Overview" });
    expect(link).toHaveClass("bx--side-nav__link--current");
    expect(link).toHaveAttribute("aria-current", "page");
  });
});
