import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const open = async (page: Page, query = "") => {
  await page.goto(`/timeline.html?${query}`);
  await expect(page.locator(".bx--timeline").first()).toBeVisible();
};

const axe = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

test.describe("Timeline a11y", () => {
  test("white", async ({ page }) => {
    await open(page);
    expect((await axe(page)).violations).toEqual([]);
  });

  test("gray 100", async ({ page }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    expect((await axe(page)).violations).toEqual([]);
  });

  test("rtl", async ({ page }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    expect((await axe(page)).violations).toEqual([]);
  });

  test("with the earlier events shown", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Show 3 earlier events" }).click();
    expect((await axe(page)).violations).toEqual([]);
  });
});
