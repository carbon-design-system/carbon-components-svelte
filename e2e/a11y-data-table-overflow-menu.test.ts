import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("DataTable OverflowMenu a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/data-table-overflow-menu.html");
    await expect(page.getByTestId("data-table-overflow")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("button", { name: "Options" }).first().click();
    await expect(
      page.getByRole("menuitem", { name: "Edit" }).first(),
    ).toBeVisible();

    const openResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(openResults.violations).toEqual([]);
  });
});
