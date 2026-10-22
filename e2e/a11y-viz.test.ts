import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Data visualization a11y", () => {
  for (const theme of ["white", "g10", "g90", "g100"]) {
    test(`has no detectable accessibility violations in ${theme}`, async ({
      page,
    }) => {
      await page.goto("/viz.html");
      await page.evaluate(
        (value) => document.documentElement.setAttribute("theme", value),
        theme,
      );
      await expect(page.getByTestId("viz")).toBeVisible();

      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });
  }

  test("has no detectable accessibility violations in the data table view", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    await page
      .locator("figure")
      .filter({ hasText: "Revenue by region" })
      .last()
      .getByRole("button", { name: "Show as table" })
      .click();
    await expect(
      page.getByRole("region", { name: "Revenue by region, data table" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
