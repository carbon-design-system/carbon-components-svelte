import { expect, test } from "@playwright/test";

test.describe("Items resync — display derived from value + items", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/items-resync.html");
  });

  test("ComboBox shows preloaded selection at mount", async ({ page }) => {
    await expect(page.getByTestId("cb-preload-id")).toHaveText("orwell");
    await expect(page.getByTestId("cb-preload")).toHaveValue("George Orwell");
  });

  test("ComboBox shows selection after async fill", async ({ page }) => {
    await expect(page.getByTestId("cb-fill")).toHaveValue("");
    await page.getByTestId("load").click();
    await expect(page.getByTestId("cb-fill-id")).toHaveText("orwell");
    await expect(page.getByTestId("cb-fill")).toHaveValue("George Orwell");
  });

  test("ComboBox keeps selection after items ref swap", async ({ page }) => {
    await expect(page.getByTestId("cb-swap")).toHaveValue("George Orwell");
    await page.getByTestId("reload").click();
    await expect(page.getByTestId("cb-swap-id")).toHaveText("orwell");
    await expect(page.getByTestId("cb-swap")).toHaveValue("George Orwell");
  });

  test("ComboBox shows selection after clear + second async fill", async ({
    page,
  }) => {
    await page.getByTestId("load").click();
    await expect(page.getByTestId("cb-fill")).toHaveValue("George Orwell");
    await page.getByTestId("clear-fill").click();
    await expect(page.getByTestId("cb-fill-id")).toHaveText("orwell");
    await page.getByTestId("load").click();
    await expect(page.getByTestId("cb-fill")).toHaveValue("George Orwell");
  });
});
