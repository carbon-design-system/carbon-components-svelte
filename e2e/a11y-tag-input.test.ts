import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("TagInput a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tag-input.html");
    await expect(
      page.getByRole("textbox", { name: "Topics", exact: true }),
    ).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("adds, reaches, and removes tags from the keyboard", async ({
    page,
  }) => {
    const input = page.getByRole("textbox", { name: "Topics", exact: true });
    const value = page.getByTestId("value");

    await input.click();
    await page.keyboard.type("Carbon,Rust");
    await page.keyboard.press("Enter");
    await expect(value).toHaveText(
      JSON.stringify(["Svelte", "TypeScript", "Carbon", "Rust"]),
    );
    await expect(input).toHaveValue("");

    // Caret at the start of an empty field: move to the last tag.
    await page.keyboard.press("Backspace");
    await expect(
      page.getByRole("button", { name: "Remove Rust" }),
    ).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(
      page.getByRole("button", { name: "Remove Carbon" }),
    ).toBeFocused();

    await page.keyboard.press("Delete");
    await expect(value).toHaveText(
      JSON.stringify(["Svelte", "TypeScript", "Rust"]),
    );

    await page.keyboard.press("Escape");
    await expect(input).toBeFocused();
  });

  test("keeps ArrowLeft in the text until the caret reaches the start", async ({
    page,
  }) => {
    const input = page.getByRole("textbox", { name: "Topics", exact: true });

    await input.click();
    await page.keyboard.type("ab");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(input).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(
      page.getByRole("button", { name: "Remove TypeScript" }),
    ).toBeFocused();
  });

  test("treats the tags as one tab stop", async ({ page }) => {
    await page.getByRole("textbox", { name: "Topics", exact: true }).focus();
    await page.keyboard.press("Shift+Tab");

    await expect(
      page.getByRole("button", { name: "Remove Svelte" }),
    ).toBeFocused();

    // Tab from the tag goes straight back to the field, past the others.
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("textbox", { name: "Topics", exact: true }),
    ).toBeFocused();
  });
});
