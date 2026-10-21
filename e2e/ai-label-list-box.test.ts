import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";

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

      // As in v11: status icon, label | clear | chevron.
      expect(decorator.x + decorator.width).toBeLessThanOrEqual(clear.x);

      const icons = [decorator, clear];
      const status = wrapper.locator(".bx--list-box__invalid-icon");
      if (await status.count()) {
        const icon = await left(status);
        expect(icon.x + icon.width).toBeLessThanOrEqual(decorator.x);
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

  for (const testId of [
    "dropdown",
    "dropdown-invalid",
    "dropdown-warning",
    "combobox-invalid",
  ]) {
    test(`${testId}: the label stays clickable above the field`, async ({
      page,
    }) => {
      const button = page
        .getByTestId(testId)
        .locator(".bx--ai-label .bx--toggletip-button");
      // The field spans the list box and comes later in the markup.
      const onTop = await button.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const hit = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        );
        return node.contains(hit);
      });
      expect(onTop).toBe(true);
    });
  }

  test("the revert button's icon sits where the label did", async ({
    page,
  }) => {
    const iconRight = (testId: string) =>
      page
        .getByTestId(testId)
        .locator(".bx--field-decorator")
        .evaluate((node) => {
          const icon = node.querySelector(
            ".bx--toggletip-button, .bx--ai-label__revert svg",
          );
          return icon?.getBoundingClientRect().right ?? Number.NaN;
        });
    expect(await iconRight("text-input-revert")).toBeCloseTo(
      await iconRight("text-input"),
      0,
    );
  });
});
