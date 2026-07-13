import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("NumberInput a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/number-input.html");
    await expect(page.getByTestId("number-input-quantity")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page
      .getByRole("button", { name: "Increment number" })
      .first()
      .click();

    const incrementedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(incrementedResults.violations).toEqual([]);
  });
});
