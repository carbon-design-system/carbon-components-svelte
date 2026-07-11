import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("TimePicker a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/time-picker.html");
    await expect(page.getByTestId("time-picker")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
