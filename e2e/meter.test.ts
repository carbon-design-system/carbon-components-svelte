import { expect, test } from "@playwright/test";

test.describe("Meter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/meter.html");
  });

  test("right-aligns the value text when there is no label", async ({
    page,
  }) => {
    const el = page.getByTestId("no-label-value-text");
    const labelRow = el.locator(".bx--meter__label");
    const valueText = el.locator(".bx--meter__value-text");

    const labelRowBox = await labelRow.boundingBox();
    const valueTextBox = await valueText.boundingBox();

    expect(labelRowBox).not.toBeNull();
    expect(valueTextBox).not.toBeNull();
    expect(
      Math.abs(
        labelRowBox.x +
          labelRowBox.width -
          (valueTextBox.x + valueTextBox.width),
      ),
    ).toBeLessThanOrEqual(1);
  });
});
