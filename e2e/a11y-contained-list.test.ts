import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ContainedList a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/contained-list.html");
    await expect(page.getByTestId("contained-list")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByText("Item 1").click();
    await expect(page.getByTestId("clicked-item")).toHaveText("1");

    const clickedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(clickedResults.violations).toEqual([]);
  });
});
