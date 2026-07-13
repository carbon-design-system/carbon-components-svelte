import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("DatePicker a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/date-picker.html");
    await expect(page.getByTestId("date-picker-meeting")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByTestId("date-picker-meeting").click();
    await expect(page.locator(".flatpickr-calendar.open")).toBeVisible();

    const openResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(openResults.violations).toEqual([]);
  });
});
