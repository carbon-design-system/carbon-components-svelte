import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const DIALOG = ".bx--tearsheet__container";

function rect(page: Page, selector: string) {
  return page.evaluate(async (selector) => {
    await document.fonts.ready;
    const container = document.querySelector(".bx--tearsheet__container");
    await Promise.all(container?.getAnimations().map((a) => a.finished) ?? []);
    const box = document.querySelector(selector)?.getBoundingClientRect();
    if (!box) throw new Error(`no ${selector}`);
    return {
      left: Math.round(box.left),
      right: Math.round(box.right),
      top: Math.round(box.top),
      bottom: Math.round(box.bottom),
      width: Math.round(box.width),
    };
  }, selector);
}

// Whether the element at the point is `selector` or inside it.
function topmostIsIn(page: Page, selector: string, x: number, y: number) {
  return page.evaluate(
    ([selector, x, y]) =>
      document
        .elementFromPoint(x as number, y as number)
        ?.closest(selector as string) != null,
    [selector, x, y],
  );
}

test.describe("Tearsheet", () => {
  test("sits at the bottom with a gap above, and fills a narrow window", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/tearsheet.html");
    await expect(
      page.getByRole("dialog", { name: "Create integration" }),
    ).toBeVisible();
    const wide = await rect(page, DIALOG);
    expect(wide.bottom).toBe(800);
    expect(wide.top).toBe(90);
    expect(wide.width).toBe(1280 - 128);

    await page.setViewportSize({ width: 320, height: 640 });
    const small = await rect(page, DIALOG);
    expect(small).toMatchObject({ top: 0, left: 0, width: 320, bottom: 640 });
    // The footer buttons share the width, so their labels stay whole.
    expect(
      (await rect(page, ".bx--tearsheet__actions .bx--btn")).width,
    ).toBeGreaterThan(120);
  });

  test("below md the header lines up with the body and keeps its title whole", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/tearsheet.html");
    await expect(page.getByRole("dialog")).toBeVisible();
    const title = await rect(page, ".bx--tearsheet__title");
    expect(title.left).toBe(
      (await rect(page, ".bx--tearsheet__main .bx--label")).left,
    );
    // The header actions go under the title instead of beside it.
    expect(
      (await rect(page, ".bx--tearsheet__header-actions .bx--btn")).top,
    ).toBeGreaterThanOrEqual(title.bottom);
    expect(
      await page
        .locator(".bx--tearsheet__title")
        .evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
  });

  test("a wide title stops short of the close button", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/tearsheet.html?passive");
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(
      (await rect(page, ".bx--tearsheet__title")).right,
    ).toBeLessThanOrEqual((await rect(page, ".bx--tearsheet__close")).left);
  });

  test("below md a wide footer's buttons are 48px tall and share the row", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 671, height: 800 });
    await page.goto("/tearsheet.html");
    await expect(page.getByRole("dialog")).toBeVisible();
    const buttons = page.locator(".bx--tearsheet__actions .bx--btn");
    const boxes = await buttons.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect()),
    );
    expect(boxes.map((box) => box.height)).toEqual([48, 48]);
    expect(boxes[0].width).toBeCloseTo(boxes[1].width, 0);
    expect(boxes[0].width + boxes[1].width).toBeGreaterThan(660);

    await page.setViewportSize({ width: 672, height: 800 });
    await expect
      .poll(() =>
        buttons.first().evaluate((node) => node.getBoundingClientRect().height),
      )
      .toBe(80);
  });

  test("a narrow tearsheet is as wide as a small modal", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/tearsheet.html?size=narrow");
    await expect(page.getByRole("dialog")).toBeVisible();
    const box = await rect(page, DIALOG);
    // 42% of the window, centered.
    expect(Math.abs(box.width - 1280 * 0.42)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.left - (1280 - box.width) / 2)).toBeLessThanOrEqual(1);
  });

  test("returns focus to the launcher after Escape", async ({ page }) => {
    await page.goto("/tearsheet.html?closed");
    await page.getByTestId("open").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Connection name" }),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("open")).toBeFocused();
    await expect(page.getByTestId("close-triggers")).toHaveText("escape-key");
    await expect(page.locator(".bx--tearsheet")).not.toHaveClass(/is-visible/);
  });

  test("menus in the body portal out of it and stay on top", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto("/tearsheet.html");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const overflow = page.getByRole("button", { name: "More options" });
    await overflow.scrollIntoViewIfNeeded();
    await overflow.click();
    const item = page.getByRole("menuitem", { name: "Duplicate" });
    await expect(item).toBeVisible();
    const box = await item.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    expect(
      await topmostIsIn(
        page,
        "[role=menuitem]",
        box.x + box.width / 2,
        box.y + box.height / 2,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(item).toBeHidden();
    await expect(dialog).toBeVisible();

    await page.getByRole("combobox", { name: "Source" }).click();
    const option = page.getByRole("option", { name: "BigQuery" });
    await expect(option).toBeVisible();
    const optionBox = await option.boundingBox();
    if (!optionBox) throw new Error("no option box");
    expect(
      await topmostIsIn(
        page,
        "[role=option]",
        optionBox.x + optionBox.width / 2,
        optionBox.y + optionBox.height / 2,
      ),
    ).toBe(true);
    expect(await dialog.locator("[role=option]").count()).toBe(0);
    await option.click();

    await page.getByRole("textbox", { name: "Start date" }).click();
    const calendar = page.locator(".bx--date-picker__calendar--open");
    await expect(calendar).toBeVisible();
    const calendarBox = await calendar.boundingBox();
    if (!calendarBox) throw new Error("no calendar box");
    expect(
      await topmostIsIn(
        page,
        ".bx--date-picker__calendar--open",
        calendarBox.x + calendarBox.width / 2,
        calendarBox.y + calendarBox.height / 2,
      ),
    ).toBe(true);
  });

  test("a Modal inside opens over the tearsheet at the window's size", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/tearsheet.html?modal");
    await page.getByRole("button", { name: "Discard changes" }).click();
    const modal = page.getByRole("dialog", { name: "Discard changes?" });
    await expect(modal).toBeVisible();
    // The tearsheet container rests with no transform, so the Modal's
    // overlay positions against the window and not the container.
    expect(await rect(page, ".bx--modal")).toMatchObject({
      top: 0,
      left: 0,
      width: 1280,
      bottom: 800,
    });
    const box = await modal.boundingBox();
    if (!box) throw new Error("no modal box");
    expect(
      await topmostIsIn(
        page,
        ".bx--modal-container",
        box.x + box.width / 2,
        box.y + box.height / 2,
      ),
    ).toBe(true);

    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
    await expect(
      page.getByRole("dialog", { name: "Create integration" }),
    ).toBeVisible();
  });

  test("a Tearsheet inside a Modal opens through a Portal, over the Modal", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/tearsheet.html?inmodal");
    await page.getByTestId("open-inner").click();
    const sheet = page.getByRole("dialog", { name: "Configure source" });
    await expect(sheet).toBeVisible();
    expect(
      await rect(page, "[data-portal] .bx--tearsheet__container"),
    ).toMatchObject({ bottom: 800, top: 90 });
    const box = await sheet.boundingBox();
    if (!box) throw new Error("no sheet box");
    expect(
      await topmostIsIn(
        page,
        ".bx--tearsheet__container",
        box.x + box.width / 2,
        box.y + box.height / 2,
      ),
    ).toBe(true);
  });

  test("a long body scrolls under a fixed header and footer, and takes a tab stop", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 700 });
    await page.goto("/tearsheet.html?long");
    await expect(page.getByRole("dialog")).toBeVisible();
    const main = page.locator(".bx--tearsheet__main");
    await expect(main).toHaveAttribute("tabindex", "0");
    await expect(main).toHaveAttribute("role", "region");
    const before = await rect(page, ".bx--tearsheet__header");
    await main.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    expect(await rect(page, ".bx--tearsheet__header")).toEqual(before);
    expect((await rect(page, ".bx--tearsheet__actions")).bottom).toBe(700);
    await expect(
      page.getByRole("textbox", { name: "Field mapping 24" }),
    ).toBeInViewport();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/tearsheet.html?long");
    await expect(page.getByRole("dialog")).toBeVisible();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("moves the close button to the left in RTL", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/tearsheet.html?passive");
    await expect(page.getByRole("dialog")).toBeVisible();
    const container = await rect(page, DIALOG);
    const ltr = await rect(page, ".bx--tearsheet__close");
    expect(container.right - ltr.right).toBeLessThanOrEqual(16);

    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const rtl = await rect(page, ".bx--tearsheet__close");
    expect(rtl.left - container.left).toBeLessThanOrEqual(16);
    expect((await rect(page, ".bx--tearsheet__title")).right).toBeGreaterThan(
      container.right - 200,
    );
  });

  test("draws its edge in forced colors and drops its motion for reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/tearsheet.html?passive");
    await expect(page.getByRole("dialog")).toBeVisible();
    // The edge is the 1px border. A focused button beside it draws a
    // border and an outline, so its ring is wider than the edge.
    await page.getByRole("button", { name: "Close" }).focus();
    const edge = await page.evaluate(() => {
      const container = getComputedStyle(
        document.querySelector(".bx--tearsheet__container") as Element,
      );
      const button = getComputedStyle(document.activeElement as Element);
      return {
        border: `${container.borderLeftWidth} ${container.borderLeftColor}`,
        outline: container.outlineStyle,
        ring:
          Number.parseFloat(button.borderTopWidth) +
          Number.parseFloat(button.outlineWidth),
      };
    });
    expect(edge.border).toBe("1px rgb(0, 0, 0)");
    expect(edge.outline).toBe("none");
    expect(edge.ring).toBeGreaterThan(1);

    await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
    expect(
      await page.evaluate(
        () =>
          getComputedStyle(
            document.querySelector(".bx--tearsheet__container") as Element,
          ).transitionDuration,
      ),
    ).toBe("0s");
  });
});
