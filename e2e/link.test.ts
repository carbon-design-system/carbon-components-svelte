import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

test.describe("Link icon scaling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/link.html");
  });

  function iconWidth(page: Page, testId: string) {
    return page
      .getByTestId(testId)
      .locator(".bx--link__icon svg")
      .evaluate((svg) => svg.getBoundingClientRect().width);
  }

  function iconGap(page: Page, testId: string) {
    return page
      .getByTestId(testId)
      .locator(".bx--link__icon")
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).marginLeft));
  }

  test("scales the icon to match the link size", async ({ page }) => {
    const sm = await iconWidth(page, "link-sm");
    const md = await iconWidth(page, "link-md");
    const lg = await iconWidth(page, "link-lg");

    // sm: 0.875rem, md: 16px (Carbon default), lg: 1.25rem
    expect(sm).toBeCloseTo(14, 0);
    expect(md).toBeCloseTo(16, 0);
    expect(lg).toBeCloseTo(20, 0);

    expect(sm).toBeLessThan(md);
    expect(md).toBeLessThan(lg);
  });

  test("tightens the icon-to-text gap on non-large sizes", async ({ page }) => {
    // sm and md: 0.25rem (4px); lg keeps Carbon's 0.5rem (8px).
    expect(await iconGap(page, "link-sm")).toBeCloseTo(4, 0);
    expect(await iconGap(page, "link-md")).toBeCloseTo(4, 0);
    expect(await iconGap(page, "link-lg")).toBeCloseTo(8, 0);
  });

  function color(page: Page, testId: string) {
    return page
      .getByTestId(testId)
      .evaluate((el) => getComputedStyle(el).color);
  }

  test("muted link inherits the parent text color", async ({ page }) => {
    // Parent paragraph sets color: rgb(10, 20, 30).
    expect(await color(page, "link-muted")).toBe("rgb(10, 20, 30)");
    // A non-muted link keeps Carbon's link color.
    expect(await color(page, "link-default")).not.toBe("rgb(10, 20, 30)");
  });
});
