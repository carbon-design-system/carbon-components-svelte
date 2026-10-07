import { expect, type Page, test } from "@playwright/test";

async function boxes(page: Page, testId: string) {
  const wrapper = page.getByTestId(testId);
  const icon = await wrapper
    .locator(".bx--list-box__invalid-icon")
    .boundingBox();
  const clear = await wrapper.locator(".bx--list-box__selection").boundingBox();
  const field = await wrapper.locator(".bx--list-box__field").boundingBox();
  if (!icon || !clear || !field) throw new Error("missing box");
  return { icon, clear, field };
}

test.describe("Dropdown clearable status icon", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dropdown-clearable.html");
  });

  for (const testId of [
    "dropdown-clearable-invalid",
    "dropdown-clearable-warning",
    "dropdown-clearable-inline-invalid",
    "dropdown-clearable-xs-invalid",
  ]) {
    test(`${testId}: the icon sits left of the clear button`, async ({
      page,
    }) => {
      const { icon, clear, field } = await boxes(page, testId);

      expect(icon.x + icon.width).toBeLessThanOrEqual(clear.x);

      // The label stops short of the icon.
      const paddingRight = await page
        .getByTestId(testId)
        .locator(".bx--list-box__field")
        .evaluate((node) =>
          Number.parseFloat(getComputedStyle(node).paddingRight),
        );
      expect(field.x + field.width - paddingRight).toBeLessThanOrEqual(icon.x);
    });
  }
});
