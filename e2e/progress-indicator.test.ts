import { expect, test } from "@playwright/test";

test.describe("ProgressIndicator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/progress-indicator.html");
  });

  test("renders progress indicator", async ({ page }) => {
    await expect(page.getByTestId("progress-indicator")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /First step/ }),
    ).toBeVisible();
  });

  test("displays all steps", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /First step/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Second step/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Third step/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Fourth step/ }),
    ).toBeVisible();
  });

  test("clicking step navigates to it", async ({ page }) => {
    await page.getByRole("button", { name: /Third step/ }).click();
    await expect(page.getByTestId("current-index")).toHaveAttribute(
      "data-current",
      "2",
    );
  });
});
