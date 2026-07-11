import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("StructuredList a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/structured-list.html");
    await expect(page.getByTestId("structured-list")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after selecting a row", async ({
    page,
  }) => {
    await page.goto("/structured-list.html");
    await page.getByText("Row A").click();
    await expect(page.getByTestId("selected-value")).toHaveText("a");

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
