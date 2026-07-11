import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("OverflowMenu a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/overflow-menu.html");
    await expect(page.getByTestId("overflow-menu")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with the menu open", async ({
    page,
  }) => {
    await page.goto("/overflow-menu.html");
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
