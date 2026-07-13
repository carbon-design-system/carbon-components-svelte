import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("TreeView multiselect a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/tree-view-multiselect.html");
    await expect(page.getByTestId("tree-view")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("treeitem", { name: "IBM Analytics Engine" }).click();
    await expect(page.getByTestId("selected-ids")).toContainText("2");

    const selectedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(selectedResults.violations).toEqual([]);
  });
});
