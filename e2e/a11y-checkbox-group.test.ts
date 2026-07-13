import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("CheckboxGroup a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/checkbox-group.html");
    await expect(page.getByTestId("checkbox-group-options")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("checkbox", { name: "Option A" }).click({
      force: true,
    });
    await expect(page.getByTestId("selected-values")).toHaveText("Selected: a");

    const checkedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(checkedResults.violations).toEqual([]);
  });
});
