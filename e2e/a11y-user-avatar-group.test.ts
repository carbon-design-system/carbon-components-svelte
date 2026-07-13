import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("UserAvatarGroup a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/user-avatar-group.html");
    await expect(page.getByTestId("overlap")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
