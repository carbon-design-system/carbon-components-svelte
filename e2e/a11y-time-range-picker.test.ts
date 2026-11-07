import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const QUERY = "now=2026-11-06T17:30:00Z&tz=America/New_York";

async function violations(page: Page) {
  const results = await new AxeBuilder({ page }).include("#app").analyze();
  return results.violations;
}

test.describe("TimeRangePicker a11y", () => {
  // The page is shared by the tests of a worker.
  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.remove("bx--g100");
      document.documentElement.removeAttribute("dir");
    });
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto(`/time-range-picker.html?${QUERY}`);
    const trigger = page.getByRole("button", { name: /^Time range/ });
    await expect(trigger).toBeVisible();
    expect(await violations(page)).toEqual([]);

    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await violations(page)).toEqual([]);

    await page.getByRole("tab", { name: "Absolute" }).click();
    await expect(page.getByLabel("Start time")).toBeVisible();
    expect(await violations(page)).toEqual([]);

    await page.getByLabel("End time").fill("00:00");
    await expect(
      page.getByText("The end must be after the start."),
    ).toBeVisible();
    expect(await violations(page)).toEqual([]);

    await page.getByRole("tab", { name: "Relative" }).click();
    await page.getByLabel("From").fill("now-");
    await page.getByLabel("To").focus();
    await expect(page.getByText(/Enter a start such as/)).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test("has none in Gray 100", async ({ page }) => {
    await page.goto(`/time-range-picker.html?${QUERY}`);
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    await page.getByRole("button", { name: /^Time range/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test("has none in a right-to-left page", async ({ page }) => {
    await page.goto(`/time-range-picker.html?${QUERY}`);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await page.getByRole("button", { name: /^Time range/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test("has none under forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto(`/time-range-picker.html?${QUERY}`);
    await page.getByRole("button", { name: /^Time range/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
});
