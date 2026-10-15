import { expect, test } from "./helpers/host";

test.describe("TagInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tag-input.html");
  });

  test.describe("status messages", () => {
    test("shows the invalid text", async ({ page }) => {
      await expect(page.getByText("Add at least two recipients")).toBeVisible();
    });

    test("shows the warning text", async ({ page }) => {
      await expect(
        page.getByText("One recipient is outside your organization"),
      ).toBeVisible();
    });

    test("shows a rejected tag's message", async ({ page }) => {
      const input = page.getByRole("textbox", { name: "Topics", exact: true });
      await input.fill("svelte");
      await input.press("Enter");

      await expect(
        page.getByText("This tag has already been added"),
      ).toBeVisible();
    });
  });
});
