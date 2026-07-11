import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Toggle a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/toggle.html");
    await expect(page.getByTestId("toggle-notifications")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after toggling on", async ({
    page,
  }) => {
    await page.goto("/toggle.html");
    await page.getByTestId("toggle-notifications").locator("label").click();
    await expect(
      page.getByRole("switch", { name: "Enable notifications" }),
    ).toBeChecked();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
