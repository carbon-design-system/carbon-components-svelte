import { expect, test } from "@playwright/test";

test.describe("CopyInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/copy-input.html");
  });

  // WebKit collapses a focus-time `select()` on mouseup; jsdom can't show it.
  test("selectTextOnFocus keeps the full value selected after a click", async ({
    page,
  }) => {
    const input = page.getByTestId("copy-input-select");
    await input.click();

    await expect
      .poll(() =>
        input.evaluate((el: HTMLInputElement) => [
          el.selectionStart,
          el.selectionEnd,
        ]),
      )
      .toEqual([0, "https://api.acme.io/v1".length]);
  });
});
