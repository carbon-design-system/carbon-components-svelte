import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("OverflowMenu a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/overflow-menu.html");
    await expect(page.getByTestId("overflow-menu")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("button", { name: "Actions" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();

    const openResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(openResults.violations).toEqual([]);
  });
});
