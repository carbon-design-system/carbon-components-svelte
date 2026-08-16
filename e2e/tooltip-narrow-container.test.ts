import { expect, test } from "@playwright/test";

test.describe("Tooltip in a narrow containing block", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-narrow-container.html");
  });

  test("centers the caret on the trigger icon", async ({ page }) => {
    const trigger = page.locator(".bx--tooltip__trigger");
    await trigger.focus();
    await expect(page.getByRole("dialog")).toBeVisible();

    const iconBox = await trigger.boundingBox();
    const caretBox = await page.locator(".bx--tooltip__caret").boundingBox();

    const iconCenterX = iconBox.x + iconBox.width / 2;
    const caretCenterX = caretBox.x + caretBox.width / 2;

    expect(caretCenterX).toBeCloseTo(iconCenterX, 0);
  });
});
