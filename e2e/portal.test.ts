import { expect, test } from "@playwright/test";

test.describe("Portal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal.html");
  });

  test("renders portal content in document.body", async ({ page }) => {
    const content = page.getByTestId("portal-inner");
    await expect(content).toHaveText("Portal content");
    await expect(content).toBeVisible();
  });

  test("portal element has data-portal attribute and is child of body", async ({
    page,
  }) => {
    const portalElement = page.locator("[data-portal]");
    await expect(portalElement).toHaveAttribute("data-portal", "");
    await expect(portalElement).toBeVisible();

    const isChildOfBody = await page.evaluate(() => {
      const portal = document.querySelector("[data-portal]");
      return portal?.parentElement === document.body;
    });
    expect(isChildOfBody).toBe(true);
  });

  test("portal content is visible and contains slot content", async ({
    page,
  }) => {
    await expect(page.getByTestId("portal-inner")).toHaveText("Portal content");
  });
});
