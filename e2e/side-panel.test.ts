import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

type Box = { left: number; right: number };

const PARTS = {
  panel: ".bx--side-panel",
  handle: ".bx--side-panel__resize-handle",
  back: ".bx--side-panel__back",
  close: ".bx--side-panel__close",
  backIcon: ".bx--side-panel__back svg",
  closeIcon: ".bx--side-panel__close svg",
  title: ".bx--side-panel__title",
  field: ".bx--side-panel__body .bx--text-input",
  primary: ".bx--side-panel__actions .bx--btn--primary",
};

function setDirection(page: Page, dir: "rtl" | "ltr") {
  return page.evaluate((dir) => {
    document.documentElement.dir = dir;
  }, dir);
}

// Measure once the entrance animation has settled.
function boxes(page: Page) {
  return page.evaluate(async (parts) => {
    await document.fonts.ready;
    const panel = document.querySelector(parts.panel);
    await Promise.all(panel?.getAnimations().map((a) => a.finished) ?? []);
    const result: Record<string, Box> = {};
    for (const [name, selector] of Object.entries(parts)) {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      if (!rect) throw new Error(`no ${selector}`);
      result[name] = {
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      };
    }
    return result;
  }, PARTS);
}

test.describe("SidePanel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/side-panel.html");
    await expect(
      page.getByRole("dialog", { name: "Edit deployment" }),
    ).toBeVisible();
  });

  // `placement="end"` is the right edge in LTR and the left edge in RTL.
  // Every part sits as far from the left edge as it sat from the right.
  test("docks to the inline end and mirrors in RTL", async ({ page }) => {
    const viewportWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    const ltr = await boxes(page);
    expect(ltr.panel.right).toBe(viewportWidth);
    // The close and back icons sit on the header's 16px padding. The
    // panel's border adds a pixel on the start side.
    expect(ltr.panel.right - ltr.closeIcon.right).toBe(16);
    expect(ltr.backIcon.left - ltr.panel.left).toBe(17);
    expect(
      Math.abs((ltr.handle.left + ltr.handle.right) / 2 - ltr.panel.left),
    ).toBeLessThanOrEqual(1);

    await setDirection(page, "rtl");
    const rtl = await boxes(page);
    // Within a pixel: half of the 479px inside the border rounds either way.
    for (const [name, box] of Object.entries(ltr)) {
      expect
        .soft(Math.abs(rtl[name].left - (viewportWidth - box.right)), name)
        .toBeLessThanOrEqual(1);
      expect
        .soft(Math.abs(rtl[name].right - (viewportWidth - box.left)), name)
        .toBeLessThanOrEqual(1);
    }

    // The back arrow points back, so it mirrors.
    const transform = await page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector(".bx--side-panel__back svg") as Element,
        ).transform,
    );
    expect(transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
  });

  // The panel takes focus only as a fallback, so it draws no ring, as
  // the modal container does. Its buttons and fields keep theirs.
  test("draws no focus ring on the panel itself", async ({ page }) => {
    const panel = page.locator(PARTS.panel);
    await page.keyboard.press("Tab");
    await panel.focus();
    await expect(panel).toBeFocused();
    expect(
      await panel.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe("none");
  });

  // The free edge faces the page, so dragging it toward the page widens
  // the panel: leftward in LTR, rightward in RTL.
  test("drags the free edge toward the page in either direction", async ({
    page,
  }) => {
    const width = page.getByTestId("width");
    const handle = page.getByRole("separator", { name: "Resize side panel" });

    async function drag(dx: number) {
      await boxes(page);
      const box = await handle.boundingBox();
      if (!box) throw new Error("no handle");
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx, y, { steps: 4 });
      await page.mouse.up();
    }

    await drag(-100);
    await expect(width).toHaveText("580");

    await setDirection(page, "rtl");
    await drag(100);
    await expect(width).toHaveText("680");
    expect((await boxes(page)).panel.left).toBe(0);
  });

  // Under a UI Shell Header the panel starts below it; without one it
  // spans the full height. `--ccs-side-panel-top` overrides both.
  test("docks under the header, or at the top without one", async ({
    page,
  }) => {
    function edges() {
      return page.evaluate(async () => {
        const panel = document.querySelector(".bx--side-panel");
        await Promise.all(panel?.getAnimations().map((a) => a.finished) ?? []);
        const rect = panel?.getBoundingClientRect();
        return {
          top: Math.round(rect?.top ?? -1),
          bottom: Math.round(rect?.bottom ?? -1),
          viewport: document.documentElement.clientHeight,
        };
      });
    }
    function setTop(value: string) {
      return page.evaluate((value) => {
        document.documentElement.style.setProperty(
          "--ccs-side-panel-top",
          value,
        );
      }, value);
    }

    const bare = await edges();
    expect(bare.top).toBe(0);
    expect(bare.bottom).toBe(bare.viewport);
    await setTop("4rem");
    expect((await edges()).top).toBe(64);

    await page.goto("/side-panel.html?header");
    const header = await page.locator(".bx--header").boundingBox();
    const docked = await edges();
    expect(docked.top).toBe(header?.height);
    expect(docked.bottom).toBe(docked.viewport);
    await setTop("0px");
    expect((await edges()).top).toBe(0);
  });
});

test.describe("SidePanel header actions", () => {
  function header(page: Page) {
    return page.evaluate(async () => {
      await document.fonts.ready;
      const panel = document.querySelector(".bx--side-panel");
      await Promise.all(panel?.getAnimations().map((a) => a.finished) ?? []);
      const rect = (selector: string) => {
        const r = document.querySelector(selector)?.getBoundingClientRect();
        if (!r) throw new Error(`no ${selector}`);
        return {
          top: Math.round(r.top),
          left: Math.round(r.left),
          right: Math.round(r.right),
        };
      };
      const buttons = [
        ...document.querySelectorAll(".bx--side-panel__corner .bx--btn"),
      ].map((button) => {
        const r = button.getBoundingClientRect();
        return Math.min(r.width, r.height);
      });
      return {
        panel: rect(".bx--side-panel"),
        title: rect(".bx--side-panel__title"),
        actions: rect(".bx--side-panel__header-actions"),
        close: rect(".bx--side-panel__close"),
        buttons,
      };
    });
  }

  // The close button stays where it is without actions, 8px (4px for
  // 40px buttons) from the top and inline end, and the title wraps before
  // the actions. In RTL each part sits as far from the panel's left edge
  // as it sat from its right.
  for (const [size, offset] of [
    ["small", 8],
    ["large", 4],
  ] as const) {
    test(`sits beside Close and mirrors in RTL (${size} buttons)`, async ({
      page,
    }) => {
      await page.goto(`/side-panel-header-actions.html?${size}`);
      const ltr = await header(page);
      expect(ltr.close.top - ltr.panel.top).toBe(offset);
      expect(ltr.panel.right - ltr.close.right).toBe(offset);
      expect(ltr.title.right).toBeLessThanOrEqual(ltr.actions.left - 8);
      expect(ltr.buttons.length).toBeGreaterThanOrEqual(3);
      for (const size of ltr.buttons) expect(size).toBeGreaterThanOrEqual(24);

      await setDirection(page, "rtl");
      const rtl = await header(page);
      for (const name of ["title", "actions", "close"] as const) {
        expect
          .soft(
            Math.abs(
              rtl[name].left -
                rtl.panel.left -
                (ltr.panel.right - ltr[name].right),
            ),
            name,
          )
          .toBeLessThanOrEqual(1);
      }
    });
  }

  test("tabs through the actions before Close", async ({ page }) => {
    await page.goto("/side-panel-header-actions.html");
    await page.getByRole("button", { name: "Previous deployment" }).focus();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Next deployment" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.locator(".bx--side-panel__decorator button"),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
  });
});
