import { expect, test } from "./helpers/host";

test.describe("UIShell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/uishell.html");
  });

  test("skip link moves focus to main content", async ({ page }) => {
    await page.getByRole("link", { name: "Skip to main content" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("opens and closes side nav from hamburger on narrow viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const sideNav = page.getByRole("navigation", { name: "Side navigation" });
    await expect(sideNav).toBeHidden();

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(sideNav).toBeVisible();
    await expect(page.getByRole("link", { name: "Side item A" })).toBeVisible();

    await page.getByRole("button", { name: "Close menu" }).click();
    await expect(sideNav).toBeHidden();
  });

  test("clicking overlay closes mobile side nav", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Side navigation" }),
    ).toBeVisible();

    // Overlay sits beside the drawer; click the dimmed region (right side).
    await page.mouse.click(340, 200);
    await expect(
      page.getByRole("navigation", { name: "Side navigation" }),
    ).toBeHidden();
  });

  test("Escape closes the innermost open layer, then the mobile side nav", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.getByRole("button", { name: "Open menu" }).click();
    const sideNav = page.getByRole("navigation", { name: "Side navigation" });

    // A header menu inside the side nav takes its own Escape.
    const headerMenu = page.getByRole("menuitem", { name: "Side submenu" });
    await headerMenu.focus();
    await page.keyboard.press("ArrowRight");
    await expect(headerMenu).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(headerMenu).toHaveAttribute("aria-expanded", "false");
    await expect(sideNav).toBeVisible();

    const menu = page.getByRole("button", { name: "Side menu" });
    await menu.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Side menu item" }),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeFocused();
    await expect(sideNav).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(sideNav).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  });
});

test.describe("UIShell header nav menu (desktop)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/uishell.html");
  });

  test("keyboard opens submenu, moves with ArrowDown, Escape closes", async ({
    page,
  }) => {
    const submenuTrigger = page.getByRole("menuitem", { name: "Submenu" });
    await submenuTrigger.focus();
    await page.keyboard.press("Space");
    const firstSub = page.getByRole("menuitem", { name: "Sub link one" });
    await expect(firstSub).toBeVisible();
    await expect(firstSub).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("menuitem", { name: "Sub link two" }),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(submenuTrigger).toBeFocused();
  });

  test("Enter on a submenu item closes it and returns focus to the trigger", async ({
    page,
  }) => {
    const submenuTrigger = page.getByRole("menuitem", { name: "Submenu" });
    await submenuTrigger.focus();
    await page.keyboard.press("Space");
    await expect(
      page.getByRole("menuitem", { name: "Sub link one" }),
    ).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(submenuTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(submenuTrigger).toBeFocused();
  });

  test("menubar is one Tab stop and arrows move between top-level items", async ({
    page,
  }) => {
    const navLink = page.getByRole("menuitem", { name: "Nav link" });
    const submenuTrigger = page.getByRole("menuitem", { name: "Submenu" });
    await navLink.focus();

    await page.keyboard.press("Tab");
    await expect(navLink).not.toBeFocused();
    await expect(submenuTrigger).not.toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(navLink).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(submenuTrigger).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("menuitem", { name: "Sub link one" }),
    ).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(navLink).toBeFocused();
    await expect(submenuTrigger).toHaveAttribute("aria-expanded", "false");
  });

  test("side nav menubar moves with Up and Down and opens submenus with Right", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.getByRole("button", { name: "Open menu" }).click();

    const link = page.getByRole("menuitem", { name: "Side nav link" });
    const trigger = page.getByRole("menuitem", { name: "Side submenu" });
    const last = page.getByRole("menuitem", { name: "Side nav last" });
    await link.focus();

    await page.keyboard.press("ArrowDown");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("ArrowRight");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("menuitem", { name: "Side sub one" }),
    ).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("menuitem", { name: "Side sub two" }),
    ).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("ArrowDown");
    await expect(last).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(link).toBeFocused();
  });
});

test.describe("UIShell HeaderSearch", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/uishell.html");
  });

  test("activates search, ArrowDown highlights results, click outside closes", async ({
    page,
  }) => {
    await page
      .locator(".bx--header__search")
      .getByRole("button", { name: "Search", exact: true })
      .click();
    const input = page.getByPlaceholder("Search...");
    await expect(input).toBeFocused();

    // selectedResultIndex starts at 0; ArrowDown advances (then wraps).
    await page.keyboard.press("ArrowDown");
    await expect(input).toHaveAttribute(
      "aria-activedescendant",
      /^ccs-[a-z0-9.]+-menuitem-1$/,
    );

    await page.keyboard.press("ArrowDown");
    await expect(input).toHaveAttribute(
      "aria-activedescendant",
      /^ccs-[a-z0-9.]+-menuitem-0$/,
    );

    await page.getByTestId("outside-header-search").click();
    await expect(input).not.toBeFocused();
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
});

test.describe("UIShell ProfileMenu", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/uishell.html");
  });

  const trigger = (page) => page.getByRole("button", { name: "Profile" });
  const card = (page) => page.locator(".bx--profile-menu");

  test("opens from the trigger and closes on outside click, then reopens", async ({
    page,
  }) => {
    await expect(card(page)).toHaveCount(0);

    await trigger(page).click();
    await expect(card(page)).toBeVisible();
    await expect(page.getByText("Sadek Bazaraa")).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();

    await page.getByTestId("main-paragraph").click();
    await expect(card(page)).toHaveCount(0);

    await trigger(page).click();
    await expect(card(page)).toBeVisible();
  });

  test("stays open when clicking inside the card", async ({ page }) => {
    await trigger(page).click();
    await page.getByText("Plan").click();
    await expect(card(page)).toBeVisible();
  });

  test("closes on Escape and restores focus to the trigger", async ({
    page,
  }) => {
    await trigger(page).click();
    await expect(card(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(card(page)).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
  });
});
