import { expect, type Locator, test } from "@playwright/test";

// WebKit collapses a focus-time `select()` on the click's mouseup, so each
// case clicks into the field and checks the whole value is still selected.
// jsdom can't show this, and CI runs Chromium only: run WebKit locally.
// `number` inputs expose no selection API, so those cases type a digit and
// expect it to replace the value.
const cases: { testId: string; check?: "replace" }[] = [
  { testId: "copy-input" },
  { testId: "text-input" },
  { testId: "password-input" },
];

async function expectFullSelection(input: Locator) {
  await expect
    .poll(() =>
      input.evaluate((el: HTMLInputElement | HTMLTextAreaElement) => ({
        start: el.selectionStart,
        wholeValue: el.value.length > 0 && el.selectionEnd === el.value.length,
      })),
    )
    .toEqual({ start: 0, wholeValue: true });
}

test.describe("selectTextOnFocus", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/select-text-on-focus.html");
  });

  for (const { testId, check } of cases) {
    test(`${testId} keeps the full value selected after a click`, async ({
      page,
    }) => {
      const input = page.getByTestId(testId);
      await input.click();

      if (check === "replace") {
        await page.keyboard.type("9");
        await expect(input).toHaveValue("9");
      } else {
        await expectFullSelection(input);
      }
    });
  }
});
