import { expect, test } from "@playwright/test";

test.describe("Popover", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/popover.html");
  });

  test("does not show content when closed", async ({ page }) => {
    const popover = page.getByTestId("popover");
    await expect(popover).not.toHaveClass(/bx--popover--open/);
  });

  test("shows content when trigger is clicked", async ({ page }) => {
    await page.getByTestId("open-popover").click();

    await expect(page.getByTestId("popover")).toHaveClass(/bx--popover--open/);
    await expect(page.getByTestId("popover-content")).toHaveText(
      "Popover content",
    );
  });

  test("closes when close button is clicked", async ({ page }) => {
    await page.getByTestId("open-popover").click();
    await expect(page.getByTestId("popover")).toHaveClass(/bx--popover--open/);

    await page.getByTestId("close-popover").click();
    await expect(page.getByTestId("popover")).not.toHaveClass(
      /bx--popover--open/,
    );
  });

  test("closes when clicking outside container", async ({ page }) => {
    await page.getByTestId("open-popover").click();
    await expect(page.getByTestId("popover")).toHaveClass(/bx--popover--open/);

    await page.getByTestId("outside").click();
    await expect(page.getByTestId("popover")).not.toHaveClass(
      /bx--popover--open/,
    );
  });

  test("popover content is visible in viewport when open", async ({ page }) => {
    await page.getByTestId("open-popover").click();
    const content = page.getByTestId("popover-content");
    await expect(content).toBeVisible();
    const box = await content.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize();
    if (box && viewport) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    }
  });
});
