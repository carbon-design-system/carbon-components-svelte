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

test.describe("FileUploader (advanced)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/file-uploader-advanced.html");
  });

  test("dispatches rejected when file exceeds maxFileSize", async ({
    page,
  }) => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .getByTestId("uploader-max")
      .locator("button")
      .filter({ hasText: "Add file" })
      .click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "too-big.bin",
      mimeType: "application/octet-stream",
      buffer: Buffer.alloc(120),
    });

    await expect(page.getByTestId("rejected-max-len")).toHaveText("1");
    await expect(page.getByTestId("rejected-max-reason")).toHaveText("size");
    await expect(page.getByText("too-big.bin")).not.toBeVisible();
  });

  test("prepends new files when orderFiles is prepend", async ({ page }) => {
    const uploader = page.getByTestId("uploader-prepend");

    const chooser1 = page.waitForEvent("filechooser");
    await uploader.locator("button").filter({ hasText: "Add files" }).click();
    await (await chooser1).setFiles({
      name: "first.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("a"),
    });
    await expect(page.getByText("first.txt")).toBeVisible();

    const chooser2 = page.waitForEvent("filechooser");
    await uploader.locator("button").filter({ hasText: "Add files" }).click();
    await (await chooser2).setFiles({
      name: "second.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("b"),
    });
    await expect(page.getByText("second.txt")).toBeVisible();

    const names = await uploader
      .locator(".bx--file-filename")
      .allTextContents();
    expect(names.map((s) => s.trim())).toEqual(["second.txt", "first.txt"]);
  });

  test("uses function iconDescription for remove control label", async ({
    page,
  }) => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .getByTestId("uploader-icon-fn")
      .locator("button")
      .filter({ hasText: "Add file" })
      .click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "labeled.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("x"),
    });

    await expect(
      page.getByRole("button", { name: "Custom remove labeled.txt" }),
    ).toBeVisible();
  });
});
