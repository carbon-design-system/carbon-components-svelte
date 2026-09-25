import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("MultiSelect a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/multiselect.html");
    await expect(page.getByTestId("multiselect-fruits")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("combobox", { name: "Fruits" }).click();
    await expect(page.getByRole("listbox").first()).toBeVisible();
    await expect(page.getByRole("option", { name: "Apple" })).toBeVisible();

    const openResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(openResults.violations).toEqual([]);
  });

  test("grouped options have no detectable accessibility violations", async ({
    page,
  }) => {
    await page.goto("/multiselect.html");
    await page.getByRole("combobox", { name: "Regions" }).click();
    await expect(
      page.getByRole("group", { name: "Americas" }).getByRole("option"),
    ).toHaveCount(2);

    const results = await new AxeBuilder({ page })
      .include('[data-testid="multiselect-grouped"]')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
