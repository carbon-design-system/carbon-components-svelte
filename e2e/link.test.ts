import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

test.describe("Link", () => {
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

  /** Reads a computed style once the color transition has finished. */
  function style(page: Page, testId: string, property: string) {
    return page.getByTestId(testId).evaluate(async (el, property) => {
      await Promise.all(el.getAnimations().map((a) => a.finished));
      return getComputedStyle(el).getPropertyValue(property);
    }, property);
  }

  test("matches v11 inline, active and focus styles", async ({ page }) => {
    expect.soft(await style(page, "link-default", "display")).toBe("inline");
    expect.soft(await style(page, "link-md", "display")).toBe("inline-flex");

    // Pressing keeps the link color and adds the focus ring.
    const press = page.getByTestId("link-press");
    const rest = await style(page, "link-press", "color");
    await press.hover();
    await page.mouse.down();
    expect.soft(await style(page, "link-press", "color"), "active").toBe(rest);
    await expect.soft(press, "active ring").toHaveCSS("outline-style", "solid");
    await expect
      .soft(press, "active underline")
      .toHaveCSS("text-decoration-line", "underline");
    await page.mouse.up();

    // A pressed disabled link shows no ring or underline.
    const disabled = page.getByTestId("link-disabled");
    await disabled.hover();
    await page.mouse.down();
    await expect
      .soft(disabled, "disabled active ring")
      .toHaveCSS("outline-style", "none");
    await expect
      .soft(disabled, "disabled active underline")
      .toHaveCSS("text-decoration-line", "none");
    await page.mouse.up();

    // Focus underlines, and inline links keep their underline.
    for (const testId of ["link-md", "link-default"]) {
      const link = page.getByTestId(testId);
      // biome-ignore lint/performance/noAwaitInLoops: one focus at a time
      await link.focus();
      await expect
        .soft(link, `${testId} focus underline`)
        .toHaveCSS("text-decoration-line", "underline");
      await expect
        .soft(link, `${testId} focus ring`)
        .toHaveCSS("outline-style", "solid");
    }
  });

  // A press outside one popover closes the other, so each gets a fresh page.
  for (const testId of ["link-toggletip", "link-ai-label"]) {
    test(`keeps the ${testId} color while pressed`, async ({ page }) => {
      const link = page.getByTestId(testId);
      const rest = await style(page, testId, "color");
      await link.hover();
      await page.mouse.down();
      expect(await style(page, testId, "color")).toBe(rest);
      await page.mouse.up();
    });
  }

  test("recolors the links in one toggletip through a hook", async ({
    page,
  }) => {
    const aiLabel = await color(page, "link-ai-label");
    await page
      .getByTestId("link-toggletip")
      .evaluate((el) =>
        el
          .closest(".bx--toggletip-actions")
          ?.setAttribute("style", "--cds-link-text-color: rgb(0, 128, 0)"),
      );
    expect(await style(page, "link-toggletip", "color")).toBe("rgb(0, 128, 0)");
    expect(await style(page, "link-ai-label", "color")).toBe(aiLabel);
  });

  test("wraps a long inline link across lines", async ({ page }) => {
    const rects = await page
      .getByTestId("link-wrap")
      .evaluate((el) => [...el.getClientRects()].map(({ top }) => top));
    // One box per line: an `inline-flex` link is a single box.
    expect(rects.length).toBeGreaterThanOrEqual(2);
    expect(rects[1]).toBeGreaterThan(rects[0]);
  });

  test("reads v11's link color custom properties", async ({ page }) => {
    // The fixture sets `--cds-link-text-color` on the link itself.
    expect(await color(page, "link-themed")).toBe("rgb(0, 128, 0)");
  });
});
