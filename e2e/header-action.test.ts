import { expect, type Locator, test } from "@playwright/test";

const tooltipShown = (locator: Locator) =>
  locator
    .locator(".bx--assistive-text")
    .evaluate((el) => getComputedStyle(el).clip === "auto");

test.describe("HeaderAction", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/header-actions.html");
  });

  test("icon-only action draws one focus ring, not a second one around the icon", async ({
    page,
  }) => {
    const help = page.getByRole("button", { name: "Help" });
    await help.focus();

    await expect(help).toHaveCSS("border-top-width", "2px");
    await expect(help.locator("svg")).toHaveCSS("outline-style", "none");
  });

  test("shows one tooltip at a time", async ({ page }) => {
    const notifications = page.getByRole("button", { name: "Notifications" });
    const help = page.getByRole("button", { name: "Help" });

    await notifications.focus();
    expect(await tooltipShown(notifications)).toBe(true);

    await help.hover();
    expect(await tooltipShown(help)).toBe(true);
    expect(await tooltipShown(notifications)).toBe(false);
  });
});
