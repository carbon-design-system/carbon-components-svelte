import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("FileUploader a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/file-uploader.html");
    await expect(page.getByTestId("file-uploader")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
