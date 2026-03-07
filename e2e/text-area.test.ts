import { expect, test } from "@playwright/test";

test.describe("TextArea", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/text-area.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByLabel("Comment")).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const textarea = page.getByLabel("Comment");
    await expect(textarea).toBeVisible();
    await textarea.fill("Hello world");
    await expect(textarea).toHaveValue("Hello world");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const textarea = page.getByTestId("text-area-comment");
    await expect(textarea).toBeVisible();
    await textarea.fill("Multi-line\ncontent");
    await expect(textarea).toHaveValue("Multi-line\ncontent");
  });

  test("shows placeholder", async ({ page }) => {
    await expect(page.getByPlaceholder("Enter your comment")).toBeVisible();
  });
});
