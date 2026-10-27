import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";

const width = (locator: Locator) =>
  locator.evaluate((el) => el.getBoundingClientRect().width);

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

  test("text action keeps its width on focus", async ({ page }) => {
    const action = page.getByRole("button", { name: "IBM Cloud" });
    const atRest = await width(action);

    await action.focus();
    await expect(action).toHaveCSS("border-top-width", "2px");
    expect(await width(action)).toBe(atRest);

    await action.click();
    await expect(action).toHaveAttribute("aria-expanded", "true");
    expect(await width(action)).toBe(atRest);
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

  test("panel width follows --ccs-header-panel-width on an ancestor", async ({
    page,
  }) => {
    const action = page.getByRole("button", { name: "Help" });
    await action.click();
    const panel = page.getByRole("region", { name: "Help" });
    await expect(panel).toHaveCSS("width", "256px");

    await page.evaluate(() => {
      const utilities = document.querySelector<HTMLElement>(
        ".bx--header__global",
      );
      utilities?.style.setProperty("--ccs-header-panel-width", "22rem");
    });
    await expect(panel).toHaveCSS("width", "352px");

    await page.setViewportSize({ width: 320, height: 640 });
    await expect(panel).toHaveCSS("width", "320px");
  });
});
