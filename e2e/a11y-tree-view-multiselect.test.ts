import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("TreeView multiselect a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/tree-view-multiselect.html");
    await expect(page.getByTestId("tree-view")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after selecting an additional node", async ({
    page,
  }) => {
    await page.goto("/tree-view-multiselect.html");
    await page.getByRole("treeitem", { name: "IBM Analytics Engine" }).click();
    await expect(page.getByTestId("selected-ids")).toContainText("2");

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
