import { expect, test } from "@playwright/test";

test.describe("TextInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/text-input.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByLabel("User name")).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const input = page.getByLabel("User name");
    await expect(input).toBeVisible();
    await input.fill("Alice");
    await expect(input).toHaveValue("Alice");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const input = page.getByTestId("text-input-username");
    await expect(input).toBeVisible();
    await input.fill("Bob");
    await expect(input).toHaveValue("Bob");
  });

  test("shows placeholder", async ({ page }) => {
    await expect(page.getByPlaceholder("Enter your name")).toBeVisible();
  });

  test("disabled input cannot be edited", async ({ page }) => {
    const input = page.getByTestId("text-input-disabled");
    await expect(input).toBeDisabled();
  });

  test("shows invalid state", async ({ page }) => {
    await expect(page.getByText("This field is required")).toBeVisible();
  });
});
