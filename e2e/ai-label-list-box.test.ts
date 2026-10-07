import { expect, type Locator, test } from "@playwright/test";

async function left(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("missing box");
  return box;
}

test.describe("AILabel in list boxes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ai-label-list-box.html");
  });

  for (const testId of [
    "dropdown",
    "dropdown-invalid",
    "dropdown-warning",
    "combobox-invalid",
  ]) {
    test(`${testId}: the text and icons do not overlap`, async ({ page }) => {
      const wrapper = page.getByTestId(testId);
      // ComboBox text sits in its input; Dropdown text sits in the field.
      const input = wrapper.locator("input.bx--text-input");
      const text = (await input.count())
        ? input
        : wrapper.locator(".bx--list-box__field");
      const clear = await left(wrapper.locator(".bx--list-box__selection"));
      const decorator = await left(wrapper.locator(".bx--field-decorator"));

      expect(clear.x + clear.width).toBeLessThanOrEqual(decorator.x);

      const icons = [clear];
      const status = wrapper.locator(".bx--list-box__invalid-icon");
      if (await status.count()) {
        const icon = await left(status);
        expect(icon.x + icon.width).toBeLessThanOrEqual(clear.x);
        icons.push(icon);
      }

      const field = await left(text);
      const paddingRight = await text.evaluate((node) =>
        Number.parseFloat(getComputedStyle(node).paddingRight),
      );
      const textEnd = field.x + field.width - paddingRight;
      expect(textEnd).toBeLessThanOrEqual(Math.min(...icons.map((i) => i.x)));
    });
  }
});
