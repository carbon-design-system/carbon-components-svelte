import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("MultiSelect a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/multiselect.html");
    await expect(page.getByTestId("multiselect-fruits")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with the menu open", async ({
    page,
  }) => {
    await page.goto("/multiselect.html");
    await page.getByRole("combobox", { name: "Fruits" }).click();
    await expect(page.getByRole("listbox").first()).toBeVisible();
    await expect(page.getByRole("option", { name: "Apple" })).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
