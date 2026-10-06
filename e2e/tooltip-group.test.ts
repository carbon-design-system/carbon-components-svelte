import { expect, type Locator, test } from "@playwright/test";

/** Computed animation of an inline tooltip's text and caret. */
const animations = (button: Locator) =>
  button.evaluate((el) => ({
    text: getComputedStyle(el.querySelector(".bx--assistive-text") as Element)
      .animationName,
    caret: getComputedStyle(el, "::before").animationName,
  }));

test.describe("TooltipGroup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-group.html");
  });

  test("the first inline tooltip fades in; the next one in the group does not", async ({
    page,
  }) => {
    const edit = page.getByRole("button", { name: "Edit" });
    const duplicate = page.getByRole("button", { name: "Duplicate" });

    await edit.hover();
    expect(await animations(edit)).toEqual({
      text: "tooltip-fade",
      caret: "tooltip-fade",
    });

    await duplicate.hover();
    await expect(duplicate).toHaveClass(/bx--tooltip--instant/);
    expect(await animations(duplicate)).toEqual({
      text: "none",
      caret: "none",
    });
  });

  test("a portalled Switch tooltip takes over from a Button with no delay", async ({
    page,
  }) => {
    const portalTooltips = page.locator(".bx--tooltip-portal__content");

    await page.getByRole("button", { name: "Duplicate" }).hover();
    await page.getByRole("tab", { name: "List view" }).hover();
    // No wait for the enter delay: the tooltip is already up.
    expect(await portalTooltips.allTextContents()).toEqual(["List view"]);

    await page.getByRole("tab", { name: "Grid view" }).hover();
    await expect(portalTooltips).toHaveText(["Grid view"]);
  });

  test("keyboard focus shows the tooltip without the fade, and hands off on Tab", async ({
    page,
  }) => {
    const edit = page.getByRole("button", { name: "Edit" });
    const duplicate = page.getByRole("button", { name: "Duplicate" });

    await edit.focus();
    expect(await animations(edit)).toEqual({ text: "none", caret: "none" });

    await page.keyboard.press("Tab");
    await expect(duplicate).toBeFocused();
    expect(await animations(duplicate)).toEqual({
      text: "none",
      caret: "none",
    });
  });

  test("an icon tooltip hides as soon as the pointer leaves", async ({
    page,
  }) => {
    const portalTooltips = page.locator(".bx--tooltip-portal__content");

    await page.getByRole("tab", { name: "List view" }).hover();
    await expect(portalTooltips).toHaveText(["List view"]);
    await page.mouse.move(0, 0);
    expect(await portalTooltips.count()).toBe(0);
  });
});
