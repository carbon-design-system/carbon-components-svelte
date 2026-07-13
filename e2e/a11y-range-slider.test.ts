import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("RangeSlider a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/range-slider.html");
    await expect(page.getByTestId("range-slider")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("slider", { name: "Lower bound" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("21");

    const changedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(changedResults.violations).toEqual([]);
  });
});
