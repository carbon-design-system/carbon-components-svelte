import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** Longer than the 100ms icon leave delay. */
const PAUSE_MS = 400;

/** `clip` of an inline tooltip's text: `auto` while it shows. */
const inlineClip = (trigger: Locator) =>
  trigger.evaluate(
    (el) =>
      getComputedStyle(el.querySelector(".bx--assistive-text") as Element).clip,
  );

async function center(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("missing box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Move the pointer in small steps, as a hand does, across any gap. */
async function moveTo(page: Page, locator: Locator) {
  const { x, y } = await center(locator);
  await page.mouse.move(x, y, { steps: 12 });
}

test.describe("Icon tooltips and the pointer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-hover.html");
  });

  for (const name of ["Edit service", "Region details", "API key"]) {
    test(`the pointer can move onto the inline tooltip of "${name}"`, async ({
      page,
    }) => {
      const trigger =
        name === "API key"
          ? page.getByRole("button", { name: "Show password" })
          : page.getByRole("button", { name });
      const tooltip = trigger.locator(".bx--assistive-text");

      await moveTo(page, trigger);
      await expect.poll(() => inlineClip(trigger)).toBe("auto");

      await moveTo(page, tooltip);
      await page.waitForTimeout(PAUSE_MS);
      expect(await inlineClip(trigger)).toBe("auto");

      await page.mouse.move(1, 1);
      await expect.poll(() => inlineClip(trigger)).not.toBe("auto");
    });
  }

  for (const name of [
    "Duplicate service",
    "Plan details",
    "Copy region",
    "Service options",
    "List view",
  ]) {
    test(`the pointer can move onto the portalled tooltip of "${name}"`, async ({
      page,
    }) => {
      const trigger =
        name === "List view"
          ? page.getByRole("tab", { name })
          : page.getByRole("button", { name });
      const tooltips = page.locator(".bx--tooltip-portal__content");

      await moveTo(page, trigger);
      await expect(tooltips).toHaveText([name]);

      await moveTo(page, tooltips);
      await page.waitForTimeout(PAUSE_MS);
      expect(await tooltips.allTextContents()).toEqual([name]);

      await page.mouse.move(1, 1);
      await expect(tooltips).toHaveCount(0);
    });
  }

  test("a click on an inline tooltip doesn't press its button", async ({
    page,
  }) => {
    const edit = page.getByRole("button", { name: "Edit service" });

    await moveTo(page, edit);
    await expect.poll(() => inlineClip(edit)).toBe("auto");
    await moveTo(page, edit.locator(".bx--assistive-text"));
    await page.mouse.down();
    await page.mouse.up();
    await expect(page.getByTestId("edits")).toHaveText("0");

    await edit.click();
    await expect(page.getByTestId("edits")).toHaveText("1");
  });

  test("moving to a neighbor hands the tooltip over at once", async ({
    page,
  }) => {
    const tooltips = page.locator(".bx--tooltip-portal__content");

    await moveTo(page, page.getByRole("tab", { name: "List view" }));
    await expect(tooltips).toHaveText(["List view"]);
    await moveTo(page, page.getByRole("tab", { name: "Grid view" }));
    // No wait for the enter delay: the next tooltip replaces the first.
    expect(await tooltips.allTextContents()).toEqual(["Grid view"]);
  });
});
