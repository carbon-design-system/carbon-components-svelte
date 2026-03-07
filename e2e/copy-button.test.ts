import { expect, test } from "@playwright/test";

test.describe("CopyButton", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/copy-button.html");
  });

  test("renders copy button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Copy to clipboard" }),
    ).toBeVisible();
  });

  test("can be located by data-testid", async ({ page }) => {
    const button = page.getByTestId("copy-button");
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("aria-label", "Copy to clipboard");
  });

  test("shows feedback on click", async ({ page }) => {
    await page.getByRole("button", { name: "Copy to clipboard" }).click();
    await expect(page.getByText("Copied!")).toBeVisible();
  });

  test("copies text when clicked", async ({ page }) => {
    await page.getByRole("button", { name: "Copy to clipboard" }).click();
    await expect(page.getByTestId("copied-value")).toContainText(
      "Hello, World!",
    );
  });
});
