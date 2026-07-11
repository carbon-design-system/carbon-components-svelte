import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("SearchMenu a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/search-menu.html");
    await expect(page.getByTestId("search-input")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with results open", async ({
    page,
  }) => {
    await page.goto("/search-menu.html");
    await page.getByRole("combobox", { name: "Search" }).click();
    await expect(page.getByRole("listbox").first()).toBeVisible();
    await expect(
      page.getByRole("option", { name: "recent vpc" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
