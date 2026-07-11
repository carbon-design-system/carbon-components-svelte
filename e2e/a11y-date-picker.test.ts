import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("DatePicker a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/date-picker.html");
    await expect(page.getByTestId("date-picker-meeting")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with the calendar open", async ({
    page,
  }) => {
    await page.goto("/date-picker.html");
    await page.getByTestId("date-picker-meeting").click();
    await expect(page.locator(".flatpickr-calendar.open")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
