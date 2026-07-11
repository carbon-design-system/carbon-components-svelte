import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("PinCodeInput a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/pin-code-input.html");
    await expect(page.getByTestId("pin-code-input-default")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
