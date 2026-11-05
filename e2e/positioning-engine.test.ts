import { expect, type Page, test } from "@playwright/test";

declare global {
  interface Window {
    __positioningStats: {
      listeners: Map<string, number>;
      resizeObservers: number;
      mutationObservers: number;
      observed: number;
    };
  }
}

/** Waits for the frames in which a portal places itself again. */
const settle = (page: Page) =>
  page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
      ),
  );

const box = async (page: Page, selector: string) => {
  await settle(page);
  const rect = await page.locator(selector).first().boundingBox();
  if (!rect) throw new Error(`${selector} has no box`);
  return rect;
};

/** The width of `text` in the field's own font, to find where a character falls. */
function textWidth(page: Page, text: string) {
  return page.getByTestId("field").evaluate((field, value) => {
    const style = getComputedStyle(field);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("no canvas");
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    return context.measureText(value).width;
  }, text);
}

test.describe("a menu on a caret", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 600 });
  });

  test("opens under the trigger character and stays there as the query grows", async ({
    page,
  }) => {
    await page.goto("/positioning-caret.html");
    const field = page.getByTestId("field");
    await field.click();
    await page.keyboard.type("hello @");
    const menu = page.locator("[data-floating-portal]");
    await expect(menu).toBeVisible();
    const first = await box(page, "[data-floating-portal]");
    const fieldBox = await box(page, "[data-testid=field]");

    // Under the first line, and at the "@": a menu aligned to the field's
    // start would be 30px or more to the left of it.
    const before = await textWidth(page, "hello ");
    expect(first.y).toBeGreaterThan(fieldBox.y + 8);
    expect(first.y).toBeLessThan(fieldBox.y + 8 + 40);
    expect(first.x - fieldBox.x).toBeGreaterThan(before - 2);
    expect(first.x - fieldBox.x).toBeLessThan(before + 20);

    await page.keyboard.type("a");
    await page.keyboard.type("m");
    await expect(menu).toBeVisible();
    const later = await box(page, "[data-floating-portal]");
    // A menu that followed the caret would move a letter's width (8px or so)
    // for each one typed.
    expect(Math.abs(later.x - first.x)).toBeLessThan(2);
    expect(Math.abs(later.y - first.y)).toBeLessThan(2);
  });

  test("follows the trigger down a line", async ({ page }) => {
    await page.goto("/positioning-caret.html");
    await page.getByTestId("field").click();
    await page.keyboard.type("@");
    const first = await box(page, "[data-floating-portal]");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Enter");
    await page.keyboard.type("@");
    await expect(page.locator("[data-floating-portal]")).toBeVisible();
    const second = await box(page, "[data-floating-portal]");
    // One line of the field's text lower.
    expect(second.y - first.y).toBeGreaterThan(14);
    expect(second.y - first.y).toBeLessThan(28);
  });

  test("follows the trigger through a textarea's own scroll", async ({
    page,
  }) => {
    await page.goto("/positioning-caret.html");
    const field = page.getByTestId("field");
    await field.click();
    await page.keyboard.type("1\n2\n3\n4\n5\n6\n7\n8\n@");
    const menu = page.locator("[data-floating-portal]");
    await expect(menu).toBeVisible();
    // The caret line has scrolled into view, so the menu sits inside the
    // field's box, not far below it.
    const placed = await box(page, "[data-floating-portal]");
    const fieldBox = await box(page, "[data-testid=field]");
    expect(placed.y).toBeLessThan(fieldBox.y + fieldBox.height + 16);
    expect(placed.y).toBeGreaterThan(fieldBox.y);
  });

  test("opens above a caret near the bottom of the window", async ({
    page,
  }) => {
    await page.goto("/positioning-caret.html?at=bottom");
    await page.getByTestId("field").click();
    await page.keyboard.type("@");
    await expect(page.locator("[data-floating-portal]")).toBeVisible();
    const placed = await box(page, "[data-floating-portal]");
    const fieldBox = await box(page, "[data-testid=field]");
    expect(placed.y + placed.height).toBeLessThanOrEqual(fieldBox.y + 40);
    expect(placed.y).toBeGreaterThanOrEqual(0);
  });

  test("sits under the caret of a one-line input", async ({ page }) => {
    await page.goto("/positioning-caret.html?field=input");
    await page.getByTestId("field").click();
    await page.keyboard.type("hi @");
    await expect(page.locator("[data-floating-portal]")).toBeVisible();
    const placed = await box(page, "[data-floating-portal]");
    const fieldBox = await box(page, "[data-testid=field]");
    expect(placed.y).toBeGreaterThan(fieldBox.y + fieldBox.height / 2);
    expect(placed.y).toBeLessThan(fieldBox.y + fieldBox.height + 12);
    const before = await textWidth(page, "hi ");
    expect(placed.x - fieldBox.x).toBeGreaterThan(before - 2);
  });

  test("sits under the trigger on an RTL page, and does not widen it", async ({
    page,
  }) => {
    await page.goto("/positioning-caret.html?dir=rtl");
    await page.getByTestId("field").click();
    await page.keyboard.type("hello @");
    await expect(page.locator("[data-floating-portal]")).toBeVisible();
    await settle(page);
    // A copy of the text parked off the start edge would add 10,000px to an
    // RTL page's scroll width.
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
    const placed = await box(page, "[data-floating-portal]");
    const fieldBox = await box(page, "[data-testid=field]");
    expect(placed.y).toBeGreaterThan(fieldBox.y);
    expect(placed.x).toBeGreaterThanOrEqual(0);
    expect(placed.x + placed.width).toBeLessThanOrEqual(widths.client + 1);
  });

  test("leaves no hidden copy of the text behind", async ({ page }) => {
    await page.goto("/positioning-caret.html");
    await page.getByTestId("field").click();
    await page.keyboard.type("@");
    await expect(page.locator("[data-floating-portal]")).toBeVisible();
    await page.keyboard.type(" ");
    await expect(page.locator("[data-floating-portal]")).toHaveCount(0);
    // One copy while the field is in use, whatever the number of reads.
    expect(await page.locator("body > div[aria-hidden='true']").count()).toBe(
      1,
    );
  });
});

test.describe("a page of open overlays", () => {
  test("shares listeners and observers, and places all of them in one frame", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1000, height: 700 });
    await page.goto("/positioning-stress.html?n=200");
    await expect(page.locator("[data-floating-portal]")).toHaveCount(200);
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );

    const stats = await page.evaluate(() => ({
      scroll: window.__positioningStats.listeners.get("scroll") ?? 0,
      resize: window.__positioningStats.listeners.get("resize") ?? 0,
      transitionend:
        window.__positioningStats.listeners.get("transitionend") ?? 0,
      resizeObservers: window.__positioningStats.resizeObservers,
      mutationObservers: window.__positioningStats.mutationObservers,
    }));
    // The window and the one scrolling box, however many tooltips.
    expect(stats.scroll).toBeLessThanOrEqual(4);
    expect(stats.resize).toBeLessThanOrEqual(1);
    expect(stats.transitionend).toBeLessThanOrEqual(1);
    expect(stats.resizeObservers).toBeLessThanOrEqual(2);
    expect(stats.mutationObservers).toBeLessThanOrEqual(2);

    // Scroll the box: every tooltip follows its button within two frames.
    await page.locator("#box").evaluate((el) => {
      el.scrollTop = 57;
    });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    const worst = await page.evaluate(() => {
      const portals = [...document.querySelectorAll("[data-floating-portal]")];
      const buttons = [...document.querySelectorAll("#box button")];
      const box = document.getElementById("box")?.getBoundingClientRect();
      let drift = 0;
      let checked = 0;
      for (const [index, portal] of portals.entries()) {
        const tip = portal.getBoundingClientRect();
        const button = buttons[index].getBoundingClientRect();
        // A tooltip above its button, its box centered on it. One whose
        // button is under the window's top edge has flipped below it.
        if (!box || button.top < 60 || button.bottom > box.bottom) continue;
        checked++;
        drift = Math.max(
          drift,
          Math.abs(tip.bottom - button.top),
          Math.abs(tip.left + tip.width / 2 - (button.left + button.width / 2)),
        );
      }
      return checked > 20 ? drift : Number.POSITIVE_INFINITY;
    });
    expect(worst).toBeLessThan(1.5);
  });
});

test.describe("scenes", () => {
  test("a box portalled into a transformed target lands on its anchor", async ({
    page,
  }) => {
    await page.goto("/positioning-scenes.html?scene=target");
    await expect(page.locator("#tip")).toBeVisible();
    // Give the second layout pass its frame.
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    const anchor = await box(page, "button");
    const tip = await box(page, "#tip");
    expect(
      Math.abs(tip.x + tip.width / 2 - (anchor.x + anchor.width / 2)),
    ).toBeLessThan(1);
    expect(Math.abs(tip.y - (anchor.y + anchor.height))).toBeLessThan(1);
  });

  test("follows an anchor through a transition, and ends on it", async ({
    page,
  }) => {
    await page.goto("/positioning-scenes.html?scene=motion");
    await page.locator("button").click();
    await expect(page.locator("#tip")).toBeVisible();
    await page.waitForTimeout(180);
    const drift = await page.evaluate(() => {
      const anchor = document.querySelector("button")?.getBoundingClientRect();
      const tip = document.querySelector("#tip")?.getBoundingClientRect();
      if (!(anchor && tip)) return Number.POSITIVE_INFINITY;
      return Math.abs(
        tip.left + tip.width / 2 - (anchor.left + anchor.width / 2),
      );
    });
    // The anchor has moved 100px or so; the tip is within a frame of it.
    expect(drift).toBeLessThan(40);
    await page.waitForTimeout(500);
    const anchor = await box(page, "button");
    const tip = await box(page, "#tip");
    expect(
      Math.abs(tip.x + tip.width / 2 - (anchor.x + anchor.width / 2)),
    ).toBeLessThan(1);
    expect(Math.abs(tip.y - (anchor.y + anchor.height))).toBeLessThan(1);
  });

  test("a menu opened in a fullscreen element renders inside it", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Fullscreen needs a gesture and a real window",
    );
    await page.goto("/positioning-scenes.html?scene=fullscreen");
    await page.getByRole("button", { name: "Go fullscreen" }).click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    const inside = await page.evaluate(() => {
      const root = document.fullscreenElement;
      return Boolean(root?.contains(document.querySelector("[role='menu']")));
    });
    expect(inside).toBe(true);
  });
});

// Where an overlay lands is checked against its anchor and the window, not
// against numbers: it has to stay in the window and stay next to what it is
// anchored to, wherever the anchor is and whatever is around it.
test.describe("overlays stay in the window and on their anchors", () => {
  const OVERLAY =
    ".bx--tooltip-portal__content, .bx--popover-contents, .bx--list-box__menu, .bx--menu, .bx--overflow-menu-options";

  const cases: Array<[string, Record<string, string>]> = [];
  for (const dir of ["ltr", "rtl"]) {
    for (const at of ["center", "topleft", "bottomright", "right"]) {
      for (const direction of ["top", "bottom", "left", "right"]) {
        // A tooltip beside its icon has no vertical fit, so one in a corner
        // of the window is cut off by it, as it is on master.
        if (
          (direction === "left" || direction === "right") &&
          (at === "topleft" || at === "bottomright")
        ) {
          continue;
        }
        cases.push([
          `tooltipicon ${direction} at ${at} ${dir}`,
          { kind: "tooltipicon", direction, at, dir, portal: "true" },
        ]);
      }
      for (const align of ["bottom", "top-start", "right-end", "left"]) {
        cases.push([
          `popover ${align} at ${at} ${dir}`,
          { kind: "popover", align, at, dir, portal: "true" },
        ]);
      }
      for (const align of ["start", "center", "end"]) {
        cases.push([
          `menubutton ${align} at ${at} ${dir}`,
          { kind: "menubutton", align, at, dir },
        ]);
      }
      // An overflow menu lines up with the icon's start, and its `flipped`
      // prop is the consumer's to set, so it only gets the window's middle.
      for (const kind of ["dropdown", "combobox", "overflowmenu"]) {
        if (kind === "overflowmenu" && at !== "center") continue;
        cases.push([
          `${kind} at ${at} ${dir}`,
          { kind, at, dir, portal: "true" },
        ]);
      }
    }
  }
  for (const ctx of [
    "clip",
    "scroll",
    "transform",
    "zoom",
    "scrolled",
    "modal",
    "dialog",
  ]) {
    for (const kind of ["tooltipicon", "popover", "dropdown", "menubutton"]) {
      cases.push([
        `${kind} in ${ctx}`,
        {
          kind,
          ctx,
          at: "center",
          ...(kind === "menubutton" ? {} : { portal: "true" }),
          ...(kind === "popover" ? { align: "bottom" } : {}),
        },
      ]);
    }
  }

  for (const [name, params] of cases) {
    test(name, async ({ page }) => {
      await page.setViewportSize({ width: 1000, height: 600 });
      await page.goto(
        `/positioning-matrix.html?${new URLSearchParams(params)}`,
      );
      await page.waitForSelector("#probe");
      const probe = page.locator("#probe");
      const { kind } = params;
      if (kind === "tooltipicon") {
        await probe
          .locator("button, [role=button], .bx--tooltip__trigger")
          .first()
          .hover();
      } else if (kind === "dropdown") {
        await probe.locator(".bx--list-box__field").first().click();
      } else if (kind === "combobox") {
        await probe.locator("input").first().click();
      } else if (kind === "menubutton") {
        await probe.locator("button").first().click();
      } else if (kind === "overflowmenu") {
        await probe.locator(".bx--overflow-menu, button").first().click();
      }
      const overlay = page
        .locator(`[data-floating-portal] :is(${OVERLAY})`)
        .first();
      await expect(overlay).toBeVisible();
      // The second placement and any transition have settled.
      await page.waitForTimeout(500);

      const { box, anchor, view } = await page.evaluate((selector) => {
        const overlay = document.querySelector(
          `[data-floating-portal] :is(${selector})`,
        );
        const anchor = document.querySelector("#probe");
        if (!(overlay && anchor)) throw new Error("no overlay or anchor");
        const o = overlay.getBoundingClientRect();
        const a = anchor.getBoundingClientRect();
        return {
          box: { left: o.left, top: o.top, right: o.right, bottom: o.bottom },
          anchor: {
            left: a.left,
            top: a.top,
            right: a.right,
            bottom: a.bottom,
          },
          view: {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
          },
        };
      }, OVERLAY);

      // In the window, to the pixel. A list that scrolls may be taller than
      // the room, and keeps its top in view.
      expect(box.left).toBeGreaterThanOrEqual(-1);
      expect(box.top).toBeGreaterThanOrEqual(-1);
      expect(box.right).toBeLessThanOrEqual(view.width + 1);
      if (kind !== "dropdown" && kind !== "combobox") {
        expect(box.bottom).toBeLessThanOrEqual(view.height + 1);
      }

      // Next to the anchor: the gap between the two boxes is a caret and a
      // margin at most.
      const gapX = Math.max(
        0,
        anchor.left - box.right,
        box.left - anchor.right,
      );
      const gapY = Math.max(
        0,
        anchor.top - box.bottom,
        box.top - anchor.bottom,
      );
      expect(Math.hypot(gapX, gapY)).toBeLessThanOrEqual(24);
    });
  }
});
