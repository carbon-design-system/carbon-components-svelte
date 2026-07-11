import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Accordion a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/accordion.html");
    await expect(page.getByTestId("accordion")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with a section expanded", async ({
    page,
  }) => {
    await page.goto("/accordion.html");
    await page.getByRole("button", { name: "Section 1" }).click();
    await expect(page.getByText("Content for section 1")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
