import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Slider a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/slider.html");
    await expect(page.getByTestId("slider")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after changing the value", async ({
    page,
  }) => {
    await page.goto("/slider.html");
    await page.getByRole("slider", { name: "Slider" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("51");

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
