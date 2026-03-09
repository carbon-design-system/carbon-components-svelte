import { expect, test } from "@playwright/test";

test.describe("FloatingPortal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/floating-portal.html");
  });

  test("does not render when open is false", async ({ page }) => {
    const content = page.getByTestId("floating-inner");
    await expect(content).not.toBeVisible();

    const portalElement = page.locator("[data-floating-portal]");
    await expect(portalElement).not.toBeVisible();
  });

  test("renders floating content when open is true", async ({ page }) => {
    await page.getByTestId("toggle").click();

    const content = page.getByTestId("floating-inner");
    await expect(content).toHaveText("Floating content");
    await expect(content).toBeVisible();
  });

  test("portal has data-floating-portal and data-floating-direction", async ({
    page,
  }) => {
    await page.getByTestId("toggle").click();

    const portalElement = page.locator("[data-floating-portal]");
    await expect(portalElement).toHaveAttribute("data-floating-portal", "true");
    await expect(portalElement).toHaveAttribute(
      "data-floating-direction",
      "bottom",
    );
  });

  test("portal is child of document.body", async ({ page }) => {
    await page.getByTestId("toggle").click();

    const isChildOfBody = await page.evaluate(() => {
      const portal = document.querySelector("[data-floating-portal]");
      return portal?.parentElement === document.body;
    });
    expect(isChildOfBody).toBe(true);
  });

  test("hides when toggle is clicked again", async ({ page }) => {
    await page.getByTestId("toggle").click();
    await expect(page.getByTestId("floating-inner")).toBeVisible();

    await page.getByTestId("toggle").click();
    await expect(page.getByTestId("floating-inner")).not.toBeVisible();
  });

  test("applies position styles when open", async ({ page }) => {
    await page.getByTestId("toggle").click();

    const style = await page
      .locator("[data-floating-portal]")
      .getAttribute("style");
    expect(style).toContain("position: absolute");
    expect(style).toMatch(/top:\s*\d+px/);
    expect(style).toMatch(/left:\s*\d+px/);
    expect(style).toContain("z-index: 9200");
  });

  test("floating content is visible and within viewport when open", async ({
    page,
  }) => {
    await page.getByTestId("toggle").click();
    const content = page.getByTestId("floating-inner");
    await expect(content).toBeVisible();
    const box = await content.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize();
    if (box && viewport) {
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 2);
    }
  });
});
