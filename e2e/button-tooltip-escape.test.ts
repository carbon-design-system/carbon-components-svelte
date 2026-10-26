import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** `clip` of an inline tooltip's text: `auto` while it shows. */
const inlineClip = (button: Locator) =>
  button.evaluate(
    (el) =>
      getComputedStyle(el.querySelector(".bx--assistive-text") as Element).clip,
  );

test.describe("Icon-only Button and CopyButton tooltips with Escape", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/button-tooltip-escape.html");
  });

  test("Escape hides each tooltip before it closes the Modal", async ({
    page,
  }) => {
    const modal = page.locator(".bx--modal");
    const portalTooltips = page.locator(".bx--tooltip-portal__content");
    const add = page.getByRole("button", { name: "Add item" });

    await expect(modal).toHaveClass(/is-visible/);
    await add.focus();
    await expect.poll(() => inlineClip(add)).toBe("auto");

    await page.keyboard.press("Escape");
    await expect.poll(() => inlineClip(add)).not.toBe("auto");
    await expect(add).toBeFocused();
    await expect(modal).toHaveClass(/is-visible/);

    // The portalled Button tooltip, then the CopyButton's.
    for (const name of ["Edit item", "Copy link"]) {
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name })).toBeFocused();
      await expect(portalTooltips).toHaveText([name]);

      await page.keyboard.press("Escape");
      await expect(portalTooltips).toHaveCount(0);
      await expect(modal).toHaveClass(/is-visible/);
    }

    // With no tooltip left to hide, Escape closes the Modal.
    await page.keyboard.press("Escape");
    await expect(modal).not.toHaveClass(/is-visible/);
  });
});
