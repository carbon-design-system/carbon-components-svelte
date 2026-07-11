import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("NumberInput a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/number-input.html");
    await expect(page.getByTestId("number-input-quantity")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after incrementing", async ({
    page,
  }) => {
    await page.goto("/number-input.html");
    await page
      .getByRole("button", { name: "Increment number" })
      .first()
      .click();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
