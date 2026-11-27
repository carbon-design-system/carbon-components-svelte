import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const field = (page: Page, id: string) => page.getByTestId(id);
const segments = (page: Page, id: string) =>
  field(page, id).getByRole("spinbutton");

test.beforeEach(async ({ page }) => {
  await page.goto("/duration-input.html");
  await expect(field(page, "duration-default")).toBeVisible();
});

test.describe("DurationInput a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has none in Gray 100", async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has none in RTL", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has none inside an open Modal", async ({ page }) => {
    await page.getByTestId("duration-open").click();
    await expect(segments(page, "duration-modal").first()).toBeVisible();
    // Axe reads colors, so wait out the modal's fade in.
    await expect(page.locator(".bx--modal.is-visible")).toHaveCount(1);
    await expect
      .poll(() =>
        page
          .locator(".bx--modal-container")
          .evaluate(
            (node) =>
              getComputedStyle(node).backgroundColor +
              document.getAnimations().length,
          ),
      )
      .toBe("rgb(244, 244, 244)0");
    const results = await new AxeBuilder({ page })
      .include("[data-testid=duration-modal]")
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
