import { expect, type Locator, test } from "@playwright/test";

/** Top and height of a group's field and its button. */
function rows(group: Locator, field = "input") {
  return group.evaluate((node, field) => {
    const box = (selector: string) => {
      const rect = node.querySelector(selector)?.getBoundingClientRect();
      return rect ? { top: rect.top, height: rect.height } : null;
    };
    return { field: box(field), button: box(".bx--btn") };
  }, field);
}

test.describe("InputGroup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/input-group.html");
  });

  for (const [size, height] of [
    ["xs", 24],
    ["sm", 32],
    ["md", 40],
    ["xl", 48],
  ] as const) {
    test(`lines the button up with a ${size} field`, async ({ page }) => {
      const { field, button } = await rows(page.getByTestId(`group-${size}`));

      expect(field?.height).toBe(height);
      expect(button?.height).toBe(height);
      expect(button?.top).toBe(field?.top);
    });
  }

  test("keeps the button level when the group shows a message", async ({
    page,
  }) => {
    const group = page.getByTestId("group-invalid");
    const { field, button } = await rows(group);

    expect(button?.top).toBe(field?.top);
    expect(button?.height).toBe(field?.height);
    await expect(group.getByText("Enter a valid email address")).toBeVisible();
  });

  test("sizes an icon-only button to the field", async ({ page }) => {
    const { field, button } = await rows(page.getByTestId("group-icon"));

    expect(button?.height).toBe(field?.height);
    expect(button?.top).toBe(field?.top);
  });

  test("fits a narrow parent, with a sized wrapper keeping its width", async ({
    page,
  }) => {
    const group = page.getByTestId("group-amount");
    const widths = await group.evaluate((node) => ({
      parent: node.getBoundingClientRect().right,
      fields: node
        .querySelector(".bx--input-group__fields")
        ?.getBoundingClientRect().right,
      select: node.querySelector("select")?.getBoundingClientRect().width,
    }));

    expect(widths.fields).toBeLessThanOrEqual(widths.parent);
    expect(widths.select).toBe(96);
  });
});
