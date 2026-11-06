import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const scan = async (page: Page) =>
  (await new AxeBuilder({ page }).include("#app").analyze()).violations;

test.describe("TextAnnotations a11y", () => {
  test("has no detectable violations at rest, with a thread open, and with a draft", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    expect(await scan(page)).toEqual([]);

    await page
      .getByRole("button", { name: /Comment by Ada Lovelace on .Effective/ })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await scan(page)).toEqual([]);
    await page.keyboard.press("Escape");

    await page.locator(".bx--text-annotations__document").focus();
    for (let i = 0; i < 6; i++) await page.keyboard.press("Shift+ArrowRight");
    await expect(
      page.getByRole("button", { name: "Comment", exact: true }),
    ).toBeVisible();
    expect(await scan(page)).toEqual([]);
    await page.getByRole("button", { name: "Comment", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "Add a comment" }),
    ).toBeFocused();
    expect(await scan(page)).toEqual([]);
  });

  test("has no violations with marks, in Gray 100 and in RTL", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html?highlight=mark");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    expect(await scan(page)).toEqual([]);

    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
    });
    expect(await scan(page)).toEqual([]);

    await page.evaluate(() => {
      document.documentElement.classList.remove("bx--g100");
      document.documentElement.setAttribute("dir", "rtl");
    });
    await page
      .getByRole("button", { name: /Comment by Ada Lovelace on .Effective/ })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test("has no violations in a mixed-direction document", async ({ page }) => {
    await page.goto("/text-annotations.html?bidi");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test("has no violations in a scrolling frame", async ({ page }) => {
    await page.goto("/text-annotations.html?scroll");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });
});
