import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("CheckboxGroup a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/checkbox-group.html");
    await expect(page.getByTestId("checkbox-group-options")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after checking an option", async ({
    page,
  }) => {
    await page.goto("/checkbox-group.html");
    await page.getByRole("checkbox", { name: "Option A" }).click({
      force: true,
    });
    await expect(page.getByTestId("selected-values")).toHaveText("Selected: a");

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
