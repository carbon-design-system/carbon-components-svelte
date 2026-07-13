import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Toggle a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/toggle.html");
    await expect(page.getByTestId("toggle-notifications")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByTestId("toggle-notifications").locator("label").click();
    await expect(
      page.getByRole("switch", { name: "Enable notifications" }),
    ).toBeChecked();

    const toggledResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(toggledResults.violations).toEqual([]);
  });
});
