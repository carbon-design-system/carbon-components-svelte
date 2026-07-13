import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("PasswordInput a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/password-input.html");
    await expect(page.getByTestId("password-input")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(page.getByTestId("password-input")).toHaveAttribute(
      "type",
      "text",
    );

    const revealedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(revealedResults.violations).toEqual([]);
  });
});
