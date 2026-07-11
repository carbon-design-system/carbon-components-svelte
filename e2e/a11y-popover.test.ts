import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Popover a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/popover.html");
    await expect(page.getByTestId("open-popover")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations when open", async ({
    page,
  }) => {
    await page.goto("/popover.html");
    await page.getByTestId("open-popover").click();
    await expect(page.getByTestId("popover-content")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
