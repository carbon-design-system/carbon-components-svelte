import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** `clip` of an inline tooltip's text: `auto` while it shows. */
function inlineClip(trigger: Locator) {
  return trigger.evaluate(
    (element) =>
      getComputedStyle(element.querySelector(".bx--assistive-text") as Element)
        .clip,
  );
}

function portalTooltips(page: Page) {
  return page.locator(".bx--tooltip-portal__content");
}

test.describe("Icon tooltips with Escape in a Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-escape.html");
  });

  test("Escape hides each tooltip before it closes the Modal", async ({
    page,
  }) => {
    const modal = page.locator(".bx--modal");
    await expect(modal).toHaveClass(/is-visible/);

    const portalled = [
      page.getByRole("tab", { name: "Grid view" }),
      page.getByRole("tab", { name: "Dashboard" }),
      page.getByRole("button", { name: "Bold" }),
      page.getByRole("button", { name: "Show password" }),
    ];
    for (const trigger of portalled) {
      // biome-ignore lint/performance/noAwaitInLoops: one tooltip at a time
      await trigger.focus();
      await expect(portalTooltips(page)).toHaveCount(1);

      await page.keyboard.press("Escape");
      await expect(portalTooltips(page)).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(modal).toHaveClass(/is-visible/);
    }

    const upload = page.getByRole("button", { name: "Upload files" });
    await upload.focus();
    await expect.poll(() => inlineClip(upload)).toBe("auto");

    await page.keyboard.press("Escape");
    await expect.poll(() => inlineClip(upload)).not.toBe("auto");
    await expect(upload).toBeFocused();
    await expect(modal).toHaveClass(/is-visible/);

    // With no tooltip left to hide, Escape closes the Modal.
    await page.keyboard.press("Escape");
    await expect(modal).not.toHaveClass(/is-visible/);
  });

  test("Escape hides a hovered tooltip, which shows again on the next hover", async ({
    page,
  }) => {
    const bold = page.getByRole("button", { name: "Bold" });
    const italic = page.getByRole("button", { name: "Italic" });

    await bold.hover();
    await expect(portalTooltips(page)).toHaveText(["Bold"]);

    await page.keyboard.press("Escape");
    await expect(portalTooltips(page)).toHaveCount(0);
    await expect(page.locator(".bx--modal")).toHaveClass(/is-visible/);

    await italic.hover();
    await bold.hover();
    await expect(portalTooltips(page)).toHaveText(["Bold"]);
  });
});
