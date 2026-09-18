import { expect, test } from "@playwright/test";

test.describe("Icon-only button tooltip near a narrow viewport's edge", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 300 });
    await page.goto("/icon-button-tooltip-overflow.html");
  });

  test("does not overflow the document while hidden", async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );

    expect(overflow).toBe(0);
  });

  test("still shows the full tooltip text on hover", async ({ page }) => {
    await page.getByTestId("delete-trigger").hover();

    await expect(
      page.getByText("Delete API key — internal dashboard"),
    ).toBeVisible();
  });
});
