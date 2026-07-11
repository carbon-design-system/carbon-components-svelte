import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Tooltip a11y", () => {
  test("has no detectable accessibility violations when open", async ({
    page,
  }) => {
    await page.goto("/tooltip.html");
    await page.getByTestId("toggle").click();
    await expect(page.getByTestId("tooltip-content")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
