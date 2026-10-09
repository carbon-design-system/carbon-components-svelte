import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("OperationalTag a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/operational-tag.html");
    await expect(
      page.getByRole("button", { name: "3 policies" }),
    ).toBeVisible();
  });

  test("has no detectable accessibility violations when open", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "3 policies" }).click();
    await expect(page.getByRole("button", { name: "Retention" })).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("opens from the keyboard and closes with Escape", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "3 policies" });

    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // WebKit's default Tab order skips plain buttons, so focus directly.
    await page.getByRole("button", { name: "Retention" }).focus();

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  test("closes a hidden tag from the TagSet popover", async ({ page }) => {
    const indicator = page.getByRole("button", { name: "+3 more tags" });

    await indicator.click();
    await page.getByRole("button", { name: /Development/ }).click();

    await expect(page.getByTestId("tags")).toHaveText(
      "Production,Staging,QA,Sandbox",
    );
    await expect(
      page.getByRole("button", { name: "+2 more tags" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
