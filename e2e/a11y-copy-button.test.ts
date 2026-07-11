import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("CopyButton a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/copy-button.html");
    await expect(page.getByTestId("copy-button")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after copying", async ({
    page,
  }) => {
    await page.goto("/copy-button.html");
    await page.getByRole("button", { name: "Copy to clipboard" }).click();
    await expect(page.getByTestId("copied-value")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
