import { expect, test } from "@playwright/test";

test.describe("FloatingPortal inside native dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/floating-portal-dialog.html");
    await page.getByTestId("open-dialog").click();
    await expect(page.getByTestId("native-dialog")).toBeVisible();
  });

  test("OverflowMenu portal mounts inside the dialog (not document.body)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "menu" }).click();

    await expect(page.getByRole("menuitem", { name: "Edit" })).toBeVisible();

    const parentTag = await page.evaluate(() => {
      const portal = document.querySelector("[data-floating-portal]");
      return portal?.parentElement?.tagName.toLowerCase() ?? null;
    });
    expect(parentTag).toBe("dialog");
  });

  test("OverflowMenu portal uses position: fixed inside the dialog", async ({
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

  test("OverflowMenu menu is anchored under its trigger inside the dialog", async ({
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
      // The menu should sit directly below the trigger (within a few px), not
      // offset by the dialog's top — that was the regression in #2873.
      expect(
        Math.abs(portalBox.y - (triggerBox.y + triggerBox.height)),
      ).toBeLessThan(8);
      expect(Math.abs(portalBox.x - triggerBox.x)).toBeLessThan(8);
    }
  });

  test("OverflowMenu menu is visible above the modal backdrop", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "menu" }).click();
    const item = page.getByRole("menuitem", { name: "Edit" });
    await expect(item).toBeVisible();

    // The item must be the topmost element at its center — if it were behind
    // the backdrop, elementFromPoint would return the backdrop / dialog.
    const isOnTop = await item.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      return hit === el || el.contains(hit);
    });
    expect(isOnTop).toBe(true);
  });

  test("Dropdown menu also auto-mounts into the dialog", async ({ page }) => {
    await page.getByRole("combobox", { name: "Region" }).click();

    const menu = page.getByRole("listbox", { name: "Region" });
    await expect(menu).toBeVisible();

    const parentTag = await menu.evaluate((el) => {
      const node: HTMLElement | null = el.closest("[data-floating-portal]");
      return node?.parentElement?.tagName.toLowerCase() ?? null;
    });
    expect(parentTag).toBe("dialog");
  });

  test("dialog closes via secondary button while menu fixture is mounted", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByTestId("native-dialog")).not.toBeVisible();
  });
});
