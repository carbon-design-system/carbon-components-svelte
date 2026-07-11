import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("TreeView a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/tree-view.html");
    await expect(page.getByTestId("tree-view")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with a node expanded", async ({
    page,
  }) => {
    await page.goto("/tree-view.html");
    await page
      .getByRole("treeitem", { name: "Parent 1" })
      .locator(".bx--tree-parent-node__toggle")
      .click();
    await expect(
      page.getByRole("treeitem", { name: "Child 1-1" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
