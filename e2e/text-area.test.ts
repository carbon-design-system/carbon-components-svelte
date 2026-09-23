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

  test("typing at the start of a value already at its limit does not change the value", async ({
    page,
  }) => {
    const textarea = page.getByTestId("text-area-at-limit");
    await expect(textarea).toHaveValue("abcde");

    await textarea.click();
    await page.keyboard.press("Home");
    await page.keyboard.type("X");

    await expect(textarea).toHaveValue("abcde");
  });

  test("accepts graphemes up to maxCount and blocks the next one", async ({
    page,
  }) => {
    const textarea = page.getByTestId("text-area-emoji");

    await textarea.click();
    await page.keyboard.type("😀😀😀");
    await expect(textarea).toHaveValue("😀😀😀");

    await page.keyboard.type("😀");
    await expect(textarea).toHaveValue("😀😀😀");
  });

  test("trims a paste to the remaining room", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.evaluate(() => navigator.clipboard.writeText("abcdef"));

    const textarea = page.getByTestId("text-area-paste");
    await textarea.click();
    await page.keyboard.press("ControlOrMeta+V");

    await expect(textarea).toHaveValue("abc");
  });
});
