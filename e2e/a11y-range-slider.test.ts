import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("RangeSlider a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/range-slider.html");
    await expect(page.getByTestId("range-slider")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after changing the lower bound", async ({
    page,
  }) => {
    await page.goto("/range-slider.html");
    await page.getByRole("slider", { name: "Lower bound" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("21");

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
