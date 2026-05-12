import { expect, test } from "@playwright/test";

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
      "search-menuitem-1",
    );

    await page.keyboard.press("ArrowDown");
    await expect(input).toHaveAttribute(
      "aria-activedescendant",
      "search-menuitem-0",
    );

    await page.getByTestId("outside-header-search").click();
    await expect(input).not.toBeFocused();
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
});
