import { expect, test } from "@playwright/test";

test.describe("FileUploader", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/file-uploader.html");
  });

  test("renders file uploader", async ({ page }) => {
    const uploader = page.getByTestId("file-uploader");
    await expect(uploader).toBeVisible();
    await expect(
      uploader.locator("button").filter({ hasText: "Add file" }),
    ).toBeVisible();
  });

  test("can select a file", async ({ page }) => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .getByTestId("file-uploader")
      .locator("button")
      .filter({ hasText: "Add file" })
      .click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Hello, World!"),
    });
    await expect(page.getByText("test.txt")).toBeVisible();
  });

  test("can remove selected file", async ({ page }) => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .getByTestId("file-uploader")
      .locator("button")
      .filter({ hasText: "Add file" })
      .click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "remove-me.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("content"),
    });
    await expect(page.getByText("remove-me.txt")).toBeVisible();
    await page.getByRole("button", { name: "Remove file" }).click();
    await expect(page.getByText("remove-me.txt")).not.toBeVisible();
  });
});
