import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ContainedList a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/contained-list.html");
    await expect(page.getByTestId("contained-list")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after clicking an item", async ({
    page,
  }) => {
    await page.goto("/contained-list.html");
    await page.getByText("Item 1").click();
    await expect(page.getByTestId("clicked-item")).toHaveText("1");

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
