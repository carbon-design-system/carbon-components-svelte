import { expect, type Locator, test } from "@playwright/test";

function outline(locator: Locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
}

test.describe("list box invalid outline", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/list-box-invalid-outline.html");
  });

  for (const testId of [
    "multiselect-filterable-selected",
    "multiselect-filterable-empty",
  ]) {
    test(`${testId}: outlines the list box, not the input`, async ({
      page,
    }) => {
      const wrapper = page.getByTestId(testId);

      expect(await outline(wrapper.locator(".bx--list-box"))).toEqual({
        style: "solid",
        width: "2px",
      });
      expect(
        (await outline(wrapper.locator("input.bx--text-input"))).style,
      ).toBe("none");
    });
  }

  test("combobox: keeps the input outline", async ({ page }) => {
    const input = page.getByTestId("combobox").locator("input");

    expect(await outline(input)).toEqual({ style: "solid", width: "2px" });
  });
});
