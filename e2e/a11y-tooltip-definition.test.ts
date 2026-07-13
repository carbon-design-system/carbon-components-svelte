import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("TooltipDefinition a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/tooltip-definition.html");
    await expect(page.getByTestId("tooltip-definition")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("button", { name: "Definition trigger" }).focus();
    await expect(page.getByText("Definition tooltip text")).toBeVisible();

    const openResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(openResults.violations).toEqual([]);
  });
});
