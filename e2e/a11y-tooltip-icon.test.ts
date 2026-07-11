import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("TooltipIcon a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/tooltip-icon.html");
    await expect(page.getByTestId("tooltip-icon")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations when open", async ({
    page,
  }) => {
    await page.goto("/tooltip-icon.html");
    await page.getByRole("button", { name: "Icon tooltip text" }).focus();
    await expect(page.getByText("Icon tooltip text")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
