import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("PasswordInput a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/password-input.html");
    await expect(page.getByTestId("password-input")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after revealing the password", async ({
    page,
  }) => {
    await page.goto("/password-input.html");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(page.getByTestId("password-input")).toHaveAttribute(
      "type",
      "text",
    );

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
