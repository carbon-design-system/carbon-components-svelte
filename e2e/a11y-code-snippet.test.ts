import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("CodeSnippet a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/code-snippet.html");
    await expect(page.getByTestId("snippet-single")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page
      .getByTestId("multi-snippet")
      .getByRole("button", { name: "Show more" })
      .click();
    await expect(
      page.getByTestId("multi-snippet").getByRole("button", {
        name: "Show less",
      }),
    ).toBeVisible();

    const expandedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(expandedResults.violations).toEqual([]);
  });
});
