import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("TooltipIcon a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/tooltip-icon.html");
    await expect(page.getByTestId("tooltip-icon")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("button", { name: "Icon tooltip text" }).focus();
    await expect(page.getByText("Icon tooltip text")).toBeVisible();

    const openResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(openResults.violations).toEqual([]);
  });
});
