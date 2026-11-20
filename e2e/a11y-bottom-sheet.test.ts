import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

const MOBILE = { width: 390, height: 780 };

/** Axe over the sheet and the page, once the entrance slide has ended. */
async function violations(page: import("@playwright/test").Page) {
  await page.evaluate(() =>
    Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => undefined)),
    ),
  );
  const results = await new AxeBuilder({ page }).include("#app").analyze();
  return results.violations;
}

test.describe("BottomSheet a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
  });

  test("a modal sheet has no violations at half and at full height", async ({
    page,
  }) => {
    await page.goto("/bottom-sheet.html");
    await page.getByTestId("open").click();
    await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
    expect.soft(await violations(page), "half").toEqual([]);

    await page.getByRole("slider", { name: "Resize sheet" }).focus();
    await page.keyboard.press("End");
    expect.soft(await violations(page), "full").toEqual([]);
  });

  test("a non-modal sheet has no violations at each snap point", async ({
    page,
  }) => {
    await page.goto("/bottom-sheet.html?variant=map");
    await expect(page.getByRole("complementary")).toBeVisible();
    const grabber = page.getByRole("slider", { name: "Resize sheet" });
    expect.soft(await violations(page), "peek").toEqual([]);
    await grabber.focus();
    await page.keyboard.press("ArrowUp");
    expect.soft(await violations(page), "half").toEqual([]);
    await page.keyboard.press("ArrowUp");
    expect.soft(await violations(page), "full").toEqual([]);
  });

  test("a sheet that fits its content has no violations", async ({ page }) => {
    await page.goto("/bottom-sheet.html?variant=action");
    await page.getByTestId("open").click();
    await expect(page.getByTestId("share")).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test("has no violations in Gray 100 and in RTL", async ({ page }) => {
    await page.goto("/bottom-sheet.html");
    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
      document.documentElement.dir = "rtl";
    });
    await page.getByTestId("open").click();
    await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
    const found = await violations(page);
    await page.evaluate(() => {
      document.documentElement.classList.remove("bx--g100");
      document.documentElement.dir = "ltr";
    });
    expect(found).toEqual([]);
  });

  test("a wide modal sheet has no violations", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/bottom-sheet.html");
    await page.getByTestId("open").click();
    await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
});
