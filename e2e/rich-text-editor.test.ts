import { expect, test } from "@playwright/test";

test.describe("RichTextEditor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rich-text-editor.html");
  });

  test("applies bold to a selection and reflects aria-pressed", async ({
    page,
  }) => {
    const editor = page.getByTestId("editor");
    const bold = page.getByRole("button", { name: "Bold" });

    await expect(bold).toHaveAttribute("aria-pressed", "false");

    await editor.click();
    await editor.pressSequentially("hello");
    await editor.selectText();
    await bold.click();

    await expect(page.getByTestId("value")).toContainText(/<(b|strong)>/i);

    // aria-pressed reflects the current selection: reselect the bolded text.
    await editor.selectText();
    await expect(bold).toHaveAttribute("aria-pressed", "true");
  });

  test("is a single tab stop with arrow-key roving", async ({ page }) => {
    const undo = page.getByRole("button", { name: "Undo" });
    const bold = page.getByRole("button", { name: "Bold" });

    await undo.focus();
    await expect(undo).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(bold).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByTestId("editor")).toBeFocused();
  });

  test("inserts a link around the selection", async ({ page }) => {
    const editor = page.getByTestId("editor");

    await editor.click();
    await editor.pressSequentially("carbon");
    await editor.selectText();

    await page.getByRole("button", { name: "Insert link" }).click();
    await page
      .getByPlaceholder("https://example.com")
      .fill("https://carbon.com");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page.getByTestId("value")).toContainText(
      'href="https://carbon.com"',
    );
  });

  test("undo reverts the last command", async ({ page }) => {
    const editor = page.getByTestId("editor");
    const bold = page.getByRole("button", { name: "Bold" });

    await editor.click();
    await editor.pressSequentially("hello");
    await editor.selectText();
    await bold.click();
    await expect(page.getByTestId("value")).toContainText(/<(b|strong)>/i);

    await page.getByRole("button", { name: "Undo" }).click();

    await expect(page.getByTestId("value")).not.toContainText(/<(b|strong)>/i);
  });
});
