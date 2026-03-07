import { expect, test } from "@playwright/test";

test.describe("Button", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/button.html");
  });

  test("renders with text", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Primary" })).toBeVisible();
  });

  test("can be located and clicked by data-testid", async ({ page }) => {
    const button = page.getByTestId("button-primary");
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.getByTestId("click-count")).toContainText("1");
  });

  test("disabled button cannot be clicked", async ({ page }) => {
    const button = page.getByRole("button", { name: "Disabled" });
    await expect(button).toBeDisabled();
  });

  test("secondary variant renders", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Secondary" })).toBeVisible();
  });
});
