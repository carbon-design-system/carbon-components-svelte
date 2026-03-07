import { expect, test } from "@playwright/test";

// Carbon breakpoints: sm=320, md=672, lg=1056, xlg=1312, max=1584
// Ranges used by breakpointObserver:
//   sm:  max-width: 672px        → viewport < 672
//   md:  min-width: 672px, max-width: 1056px
//   lg:  min-width: 1056px, max-width: 1312px
//   xlg: min-width: 1312px, max-width: 1584px
//   max: min-width: 1584px

test.describe("Breakpoint", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/breakpoint.html");
  });

  test("detects sm breakpoint", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 720 });
    await expect(page.getByTestId("current-size")).toHaveText("sm");
    await expect(page.getByTestId("is-sm")).toHaveText("true");
  });

  test("detects md breakpoint", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 });
    await expect(page.getByTestId("current-size")).toHaveText("md");
    await expect(page.getByTestId("is-md")).toHaveText("true");
  });

  test("detects lg breakpoint", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 720 });
    await expect(page.getByTestId("current-size")).toHaveText("lg");
    await expect(page.getByTestId("is-lg")).toHaveText("true");
  });

  test("detects xlg breakpoint", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 720 });
    await expect(page.getByTestId("current-size")).toHaveText("xlg");
    await expect(page.getByTestId("is-xlg")).toHaveText("true");
  });

  test("detects max breakpoint", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 720 });
    await expect(page.getByTestId("current-size")).toHaveText("max");
    await expect(page.getByTestId("is-max")).toHaveText("true");
  });

  test("responds to dynamic viewport changes", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 720 });
    await expect(page.getByTestId("current-size")).toHaveText("sm");

    await page.setViewportSize({ width: 1600, height: 720 });
    await expect(page.getByTestId("current-size")).toHaveText("max");

    await page.setViewportSize({ width: 800, height: 720 });
    await expect(page.getByTestId("current-size")).toHaveText("md");
  });
});
