import { expect, test } from "@playwright/test";

test.describe("FloatingPortal inside native popover", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/floating-portal-popover.html");
    await page.getByTestId("open-popover").click();
    await expect(page.getByTestId("native-popover")).toBeVisible();
  });

  test("OverflowMenu portal mounts inside the popover (not document.body)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "menu" }).click();

    await expect(page.getByRole("menuitem", { name: "Edit" })).toBeVisible();

    const parentTestId = await page.evaluate(() => {
      const portal = document.querySelector("[data-floating-portal]");
      return portal?.parentElement?.getAttribute("data-testid") ?? null;
    });
    expect(parentTestId).toBe("native-popover");
  });

  test("OverflowMenu portal uses position: fixed inside the popover", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "menu" }).click();
    await expect(page.getByRole("menuitem", { name: "Edit" })).toBeVisible();

    const style = await page
      .locator("[data-floating-portal]")
      .getAttribute("style");
    expect(style).toContain("position: fixed");
    expect(style).not.toContain("position: absolute");
  });

  test("OverflowMenu menu is anchored under its trigger inside the popover", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "menu" });
    await trigger.click();
    await expect(page.getByRole("menuitem", { name: "Edit" })).toBeVisible();

    const triggerBox = await trigger.boundingBox();
    const portalBox = await page
      .locator("[data-floating-portal]")
      .boundingBox();

    expect(triggerBox).not.toBeNull();
    expect(portalBox).not.toBeNull();
    if (triggerBox && portalBox) {
      expect(
        Math.abs(portalBox.y - (triggerBox.y + triggerBox.height)),
      ).toBeLessThan(8);
      expect(Math.abs(portalBox.x - triggerBox.x)).toBeLessThan(8);
    }
  });

  test("OverflowMenu menu is hit-testable at its center (popover top layer)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "menu" }).click();
    const item = page.getByRole("menuitem", { name: "Edit" });
    await expect(item).toBeVisible();

    const isOnTop = await item.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      return hit === el || el.contains(hit);
    });
    expect(isOnTop).toBe(true);
  });

  test("Dropdown menu also auto-mounts into the popover", async ({ page }) => {
    await page.getByRole("combobox", { name: "Region" }).click();

    const menu = page.getByRole("listbox", { name: "Region" });
    await expect(menu).toBeVisible();

    const parentTestId = await menu.evaluate((el) => {
      const node: HTMLElement | null = el.closest("[data-floating-portal]");
      return node?.parentElement?.getAttribute("data-testid") ?? null;
    });
    expect(parentTestId).toBe("native-popover");
  });

  test("popover closes via secondary button while menu fixture is mounted", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByTestId("native-popover")).not.toBeVisible();
  });
});
