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

  // As in Carbon React, the focus a click leaves doesn't hold the tooltip
  // open once the pointer leaves. Focus from the keyboard still shows it.
  test("the inline tooltip of a clicked button closes when the pointer leaves", async ({
    page,
  }) => {
    const edit = page.getByRole("button", { name: "Edit service" });

    await edit.click();
    await page.mouse.move(1, 1);
    await page.waitForTimeout(PAUSE_MS);
    expect(await inlineClip(edit)).not.toBe("auto");

    // A key press ends the click's hold. macOS Firefox and Safari don't
    // focus a clicked button, so focus it directly.
    await edit.blur();
    await page.keyboard.press("Shift");
    await edit.focus();
    await expect.poll(() => inlineClip(edit)).toBe("auto");
  });

  for (const name of ["Duplicate service", "List view"]) {
    test(`the portalled tooltip of a clicked "${name}" closes when the pointer leaves`, async ({
      page,
    }) => {
      const trigger =
        name === "List view"
          ? page.getByRole("tab", { name })
          : page.getByRole("button", { name });
      const tooltips = page.locator(".bx--tooltip-portal__content");

      await trigger.click();
      await page.mouse.move(1, 1);
      await page.waitForTimeout(PAUSE_MS);
      await expect(tooltips).toHaveCount(0);

      await trigger.blur();
      await page.keyboard.press("Shift");
      await trigger.focus();
      await expect(tooltips).toHaveText([name]);
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

/** Center of the part of `top` that covers `below`. */
async function overlapCenter(top: Locator, below: Locator) {
  const a = await top.boundingBox();
  const b = await below.boundingBox();
  if (!a || !b) throw new Error("missing box");
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const upper = Math.max(a.y, b.y);
  const lower = Math.min(a.y + a.height, b.y + b.height);
  if (left >= right || upper >= lower) throw new Error("no overlap");
  return { x: (left + right) / 2, y: (upper + lower) / 2 };
}

/** Center of the part of `top` that covers neither of `others`. */
async function clearCenter(top: Locator, others: Locator[]) {
  const box = await top.boundingBox();
  if (!box) throw new Error("missing box");
  const boxes = await Promise.all(others.map((other) => other.boundingBox()));
  let left = box.x;
  let right = box.x + box.width;
  for (const o of boxes) {
    if (!o) throw new Error("missing box");
    // The others sit beside the tooltip in the row: trim them off.
    if (o.x + o.width > left && o.x < right) {
      if (o.x <= left) left = o.x + o.width;
      else right = o.x;
    }
  }
  if (left + 4 >= right) throw new Error("no clear part");
  return { x: (left + right) / 2, y: box.y + box.height / 2 };
}

// A row of ghost buttons whose tooltips open toward the next button, as
// in #937: Delete's tooltip covers Save.
test.describe("An icon tooltip over the next button", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-hover.html");
  });

  const toolbars = [
    { id: "inline", portal: false },
    { id: "portal", portal: true },
    { id: "rtl", portal: false },
  ];

  function parts(page: Page, id: string, portal: boolean) {
    const toolbar = page.getByTestId(`toolbar-${id}`);
    const button = (name: string) => toolbar.getByRole("button", { name });
    const tooltipOf = (name: string) =>
      portal
        ? page.locator(".bx--tooltip-portal").filter({ hasText: name })
        : button(name).locator(".bx--assistive-text");
    const isShown = async (name: string) =>
      portal
        ? (await tooltipOf(name).count()) > 0
        : (await inlineClip(button(name))) === "auto";
    return {
      button,
      tooltipOf,
      isShown,
      pressed: toolbar.getByTestId("pressed"),
    };
  }

  for (const { id, portal } of toolbars) {
    for (const steps of [12, 1]) {
      const pace = steps === 1 ? "at once" : "by hand";
      test(`${id}: moving from Delete onto its tooltip over Save ${pace} lets the click press Save`, async ({
        page,
      }) => {
        const { button, tooltipOf, isShown, pressed } = parts(page, id, portal);

        await moveTo(page, button("Delete"));
        await expect.poll(() => isShown("Delete")).toBe(true);

        const { x, y } = await overlapCenter(
          tooltipOf("Delete"),
          button("Save"),
        );
        await page.mouse.move(x, y, { steps });
        await expect.poll(() => isShown("Delete")).toBe(false);

        await page.mouse.down();
        await page.mouse.up();
        await expect(pressed).toHaveText("Save");
      });
    }

    test(`${id}: the pointer can rest on a tooltip that covers no control`, async ({
      page,
    }) => {
      const { button, tooltipOf, isShown, pressed } = parts(page, id, portal);

      await moveTo(page, button("Save"));
      await expect.poll(() => isShown("Save")).toBe(true);

      const { x, y } = await clearCenter(tooltipOf("Save"), [
        button("Save"),
        button("Delete"),
        button("Add"),
      ]);
      await page.mouse.move(x, y, { steps: 12 });
      await page.waitForTimeout(PAUSE_MS);
      expect(await isShown("Save")).toBe(true);

      // The click on the tooltip presses nothing.
      await page.mouse.down();
      await page.mouse.up();
      await expect(pressed).toHaveText("");
    });
  }
});
