import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Slider a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/slider.html");
    await expect(page.getByTestId("slider")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("slider", { name: "Slider" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("51");

    const changedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(changedResults.violations).toEqual([]);
  });
});
