import { expect, test } from "@playwright/test";

test.describe("ButtonSet", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/button-set.html");
  });

  test("buttons shrink to fit a narrow container", async ({ page }) => {
    const container = page.getByTestId("button-set-narrow");
    const overflow = await container.evaluate(
      (el) => el.scrollWidth <= el.clientWidth,
    );
    expect(overflow).toBe(true);
  });

  test("buttons stay capped at their max width in a wide container", async ({
    page,
  }) => {
    const buttons = page.getByTestId("button-set-wide").locator(".bx--btn");
    const widths = await buttons.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().width),
    );
    for (const width of widths) {
      expect(width).toBeLessThanOrEqual(196);
    }
  });
});
