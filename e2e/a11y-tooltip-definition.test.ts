import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("TooltipDefinition a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/tooltip-definition.html");
    await expect(page.getByTestId("tooltip-definition")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations when open", async ({
    page,
  }) => {
    await page.goto("/tooltip-definition.html");
    await page.getByRole("button", { name: "Definition trigger" }).focus();
    await expect(page.getByText("Definition tooltip text")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
