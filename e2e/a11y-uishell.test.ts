import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("UIShell a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/uishell.html");
    await expect(page.getByTestId("main-paragraph")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with the profile menu open", async ({
    page,
  }) => {
    await page.goto("/uishell.html");
    await page.getByRole("button", { name: "Profile" }).click();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with a header nav submenu open", async ({
    page,
  }) => {
    await page.goto("/uishell.html");
    await page.getByRole("menuitem", { name: "Submenu" }).click();
    await expect(
      page.getByRole("menuitem", { name: "Sub link one" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
