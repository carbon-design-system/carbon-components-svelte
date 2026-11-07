import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("TreeSelect a11y", () => {
  test("has no detectable accessibility violations, open or closed", async ({
    page,
  }) => {
    await page.goto("/tree-select.html");
    await expect(page.getByTestId("multi")).toBeVisible();

    const closed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(closed.violations).toEqual([]);

    await page.getByRole("combobox", { name: "Multi", exact: true }).click();
    await expect(page.getByRole("treeitem", { name: "Germany" })).toBeVisible();
    const open = await new AxeBuilder({ page }).include("#app").analyze();
    expect(open.violations).toEqual([]);
  });

  test("a searched, windowed menu has no violations", async ({ page }) => {
    await page.goto("/tree-select.html");
    await page.getByRole("combobox", { name: "Big single" }).click();
    await expect(page.getByRole("tree")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("every size and state has no violations", async ({ page }) => {
    await page.goto("/tree-select-states.html");
    await expect(page.getByTestId("fluid")).toBeVisible();

    // A disabled control is exempt from contrast, but its helper text is not
    // tagged as disabled for axe.
    const results = await new AxeBuilder({ page })
      .include("#app")
      .exclude('[data-testid$="-disabled"]')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
