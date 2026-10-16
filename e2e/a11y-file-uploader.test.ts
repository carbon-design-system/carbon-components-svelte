import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("FileUploader a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/file-uploader.html");
    await expect(page.getByTestId("file-uploader")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  // Browsers expose a file input as a button, so the visually hidden input
  // would read as a second button with the same name in browse mode.
  test("exposes one add button", async ({ page }) => {
    await page.goto("/file-uploader.html");

    await expect(page.getByRole("button", { name: "Add file" })).toHaveCount(1);
  });
});

test.describe("FileUploaderDropContainer a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/file-uploader-drop-container.html");
    await expect(page.getByRole("button")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("exposes one drop target", async ({ page }) => {
    await page.goto("/file-uploader-drop-container.html");

    await expect(
      page.getByRole("button", { name: "Drop files here or click to upload" }),
    ).toHaveCount(1);
  });
});
