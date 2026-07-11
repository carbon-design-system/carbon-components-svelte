import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("MenuButton a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/menu-button.html");
    await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with the menu open", async ({
    page,
  }) => {
    await page.goto("/menu-button.html");
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Cut" })).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
