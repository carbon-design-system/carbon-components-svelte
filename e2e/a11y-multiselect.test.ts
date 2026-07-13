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
});
