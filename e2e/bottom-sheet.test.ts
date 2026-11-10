import type { CDPSession, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const SHEET = ".bx--bottom-sheet";
const BODY = ".bx--bottom-sheet__body";
const MOBILE = { width: 390, height: 780 };

/** The sheet's visible top edge and height, measured once it has settled. */
function sheetBox(page: Page) {
  return page.evaluate(
    async ({ sheet }) => {
      const el = document.querySelector(sheet);
      if (!el) throw new Error("no sheet");
      await Promise.all(
        el.getAnimations().map((a) => a.finished.catch(() => undefined)),
      );
      const rect = el.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        visible: Math.round(window.innerHeight - rect.top),
      };
    },
    { sheet: SHEET },
  );
}

const visibleNow = (page: Page) =>
  page.evaluate(
    (sheet) =>
      Math.round(
        window.innerHeight -
          (document.querySelector(sheet)?.getBoundingClientRect().top ?? 0),
      ),
    SHEET,
  );

type Point = { x: number; y: number };

/** A finger, through CDP, which Chromium sends as real touch events. */
async function finger(page: Page) {
  test.skip(
    page.context().browser()?.browserType().name() !== "chromium",
    "CDP touch events are Chromium only",
  );
  const cdp: CDPSession = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 1,
  });
  const send = (type: string, touchPoints: Point[]) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints });
  return {
    down: (p: Point) => send("touchStart", [p]),
    move: (p: Point) => send("touchMove", [p]),
    up: async () => {
      await send("touchEnd", []);
      // Detaching clears the touch emulation, and the browser has not
      // delivered the release yet.
      await page.waitForTimeout(100);
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
      await cdp.detach();
    },
  };
}

async function touchDrag(
  page: Page,
  from: Point,
  to: Point,
  { steps = 12, stepMs = 16, hold = false } = {},
) {
  const f = await finger(page);
  await f.down(from);
  for (let i = 1; i <= steps; i++) {
    await f.move({
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps,
    });
    await page.waitForTimeout(stepMs);
  }
  // A held finger loses its speed before it lifts.
  if (hold) await page.waitForTimeout(250);
  await f.up();
}

/** Wait for the entrance slide and any snap transition to end. */
const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => undefined)),
    ),
  );

const grabberPoint = async (page: Page) => {
  await settled(page);
  return page.locator(".bx--bottom-sheet__grabber").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
};

test.describe("BottomSheet modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/bottom-sheet.html");
    await page.getByTestId("open").click();
    await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
  });

  test("is a named modal dialog with a grabber slider at the half snap", async ({
    page,
  }) => {
    const dialog = page.getByRole("dialog", { name: "Filters" });
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    const grabber = page.getByRole("slider", { name: "Resize sheet" });
    await expect(grabber).toHaveAttribute("aria-valuetext", "Half height");
    await expect.poll(async () => (await sheetBox(page)).visible).toBe(390);
  });

  test("the grabber's arrow keys move between snap points", async ({
    page,
  }) => {
    const grabber = page.getByRole("slider", { name: "Resize sheet" });
    await grabber.focus();
    await page.keyboard.press("ArrowUp");
    await expect(grabber).toHaveAttribute("aria-valuetext", "Full height");
    await expect.poll(async () => (await sheetBox(page)).visible).toBe(732);
    await page.keyboard.press("ArrowUp");
    await expect(grabber).toHaveAttribute("aria-valuenow", "1");
    await page.keyboard.press("ArrowDown");
    await expect(grabber).toHaveAttribute("aria-valuetext", "Half height");
    await page.keyboard.press("End");
    await expect(grabber).toHaveAttribute("aria-valuetext", "Full height");
    await page.keyboard.press("Home");
    await expect(grabber).toHaveAttribute("aria-valuetext", "Half height");
    await expect(page.getByTestId("log")).toHaveText(
      "snap:keyboard,snap:keyboard,snap:keyboard,snap:keyboard",
    );
  });

  test("Escape closes the sheet and returns focus to the opener", async ({
    page,
  }) => {
    await page.keyboard.press("Escape");
    await expect(page.locator(SHEET)).toHaveCount(0);
    await expect(page.getByTestId("log")).toHaveText("close:escape-key");
    await expect(page.getByTestId("open")).toBeFocused();
  });

  test("keeps Tab inside the sheet", async ({ page }) => {
    const inside = new Set<string>();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      inside.add(
        await page.evaluate(
          () =>
            document.activeElement?.closest(".bx--bottom-sheet")?.id ?? "OUT",
        ),
      );
    }
    expect([...inside].some((id) => id === "OUT")).toBe(false);
  });

  test("a snap point below the tallest keeps the footer on the visible bottom", async ({
    page,
  }) => {
    await settled(page);
    const apply = page.getByRole("button", { name: "Apply" });
    await expect(apply).toBeInViewport();
    const rect = await apply.boundingBox();
    expect(Math.round(rect!.y + rect!.height)).toBe(MOBILE.height);
  });

  test("a field the sheet hides is revealed by moving to the next snap point", async ({
    page,
  }) => {
    // Option 30 sits far below the half snap point.
    await page.getByLabel("Option 30").focus();
    await expect(
      page.getByRole("slider", { name: "Resize sheet" }),
    ).toHaveAttribute("aria-valuetext", "Full height");
    await expect(page.getByTestId("log")).toHaveText("snap:focus");
  });

  test("a touch drag on the grabber moves the sheet and snaps on release", async ({
    page,
  }) => {
    const { x, y } = await grabberPoint(page);
    // Up past the midpoint: full.
    await touchDrag(page, { x, y }, { x, y: y - 220 }, { hold: true });
    await expect.poll(() => visibleNow(page)).toBe(732);
    // A short pull back that stays nearer full than half returns to full.
    const g = await grabberPoint(page);
    await touchDrag(page, g, { x: g.x, y: g.y + 60 }, { hold: true });
    await expect.poll(() => visibleNow(page)).toBe(732);
  });

  test("a mouse drag on the grabber moves the sheet, in every engine", async ({
    page,
  }) => {
    const { x, y } = await grabberPoint(page);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 120, { steps: 6 });
    // Held: the sheet follows the pointer, a little taller than half.
    expect(await visibleNow(page)).toBeGreaterThan(390);
    await page.waitForTimeout(200);
    await page.mouse.up();
    await expect.poll(() => visibleNow(page)).toBe(390);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 260, { steps: 6 });
    await page.waitForTimeout(200);
    await page.mouse.up();
    await expect.poll(() => visibleNow(page)).toBe(732);
  });

  test("a fast flick jumps to the next snap point on a short travel", async ({
    page,
  }) => {
    const { x, y } = await grabberPoint(page);
    // 60px is less than a quarter of the way to full, yet fast.
    await touchDrag(page, { x, y }, { x, y: y - 60 }, { steps: 4, stepMs: 10 });
    await expect.poll(() => visibleNow(page)).toBe(732);
  });

  test("a slow short drag settles back", async ({ page }) => {
    const { x, y } = await grabberPoint(page);
    await touchDrag(
      page,
      { x, y },
      { x, y: y - 60 },
      { steps: 6, stepMs: 40, hold: true },
    );
    await expect.poll(() => visibleNow(page)).toBe(390);
    await expect(page.getByTestId("log")).toHaveText("");
  });

  test("dragging down past the shortest snap point dismisses", async ({
    page,
  }) => {
    const { x, y } = await grabberPoint(page);
    await touchDrag(page, { x, y }, { x, y: y + 300 }, { hold: true });
    await expect(page.locator(SHEET)).toHaveCount(0);
    await expect(page.getByTestId("log")).toHaveText("close:drag");
  });

  test("stretches past the tallest snap point with resistance and returns", async ({
    page,
  }) => {
    await page.getByRole("slider", { name: "Resize sheet" }).focus();
    await page.keyboard.press("End");
    await expect.poll(() => visibleNow(page)).toBe(732);
    const { x, y } = await grabberPoint(page);
    const f = await finger(page);
    await f.down({ x, y });
    for (let i = 1; i <= 10; i++) {
      await f.move({ x, y: y - i * 20 });
      await page.waitForTimeout(16);
    }
    // 200px of travel, a stretch of well under 56px.
    const stretched = await visibleNow(page);
    expect(stretched).toBeGreaterThan(732);
    expect(stretched).toBeLessThan(732 + 56);
    await page.waitForTimeout(150);
    await f.up();
    await expect.poll(() => visibleNow(page)).toBe(732);
  });

  test.describe("scroll and drag in long content", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("slider", { name: "Resize sheet" }).focus();
      await page.keyboard.press("End");
      await expect.poll(() => visibleNow(page)).toBe(732);
    });

    const bodyPoint = async (page: Page) => {
      await settled(page);
      return page.locator(BODY).evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    };

    test("at full height an upward drag scrolls the content, not the sheet", async ({
      page,
    }) => {
      const { x, y } = await bodyPoint(page);
      await touchDrag(page, { x, y }, { x, y: y - 200 }, { hold: true });
      expect(
        await page.locator(BODY).evaluate((el) => el.scrollTop),
      ).toBeGreaterThan(100);
      expect(await visibleNow(page)).toBe(732);
    });

    test("a downward drag scrolls content that is not at the top", async ({
      page,
    }) => {
      await page.locator(BODY).evaluate((el) => {
        el.scrollTop = 400;
      });
      const { x, y } = await bodyPoint(page);
      await touchDrag(page, { x, y }, { x, y: y + 100 }, { hold: true });
      const top = await page.locator(BODY).evaluate((el) => el.scrollTop);
      expect(top).toBeLessThan(400);
      expect(await visibleNow(page)).toBe(732);
    });

    test("a downward drag with the content at the top moves the sheet", async ({
      page,
    }) => {
      const { x, y } = await bodyPoint(page);
      await touchDrag(page, { x, y }, { x, y: y + 200 }, { hold: true });
      await expect.poll(() => visibleNow(page)).toBe(390);
      expect(await page.locator(BODY).evaluate((el) => el.scrollTop)).toBe(0);
    });

    test("a scroll that reaches the top hands the rest of the drag to the sheet", async ({
      page,
    }) => {
      await page.locator(BODY).evaluate((el) => {
        el.scrollTop = 120;
      });
      const { x, y } = await bodyPoint(page);
      const f = await finger(page);
      await f.down({ x, y });
      let lowest = 732;
      for (let i = 1; i <= 24; i++) {
        await f.move({ x, y: y + i * 12 });
        await page.waitForTimeout(16);
        lowest = Math.min(lowest, await visibleNow(page));
      }
      await f.up();
      // 288px of travel: 120 scrolled the content, the rest moved the sheet.
      expect(lowest).toBeLessThan(732 - 60);
      expect(await page.locator(BODY).evaluate((el) => el.scrollTop)).toBe(0);
    });

    test("a sideways drag leaves the sheet alone", async ({ page }) => {
      const { x, y } = await bodyPoint(page);
      await touchDrag(
        page,
        { x: x + 100, y },
        { x: x - 100, y: y + 20 },
        { hold: true },
      );
      expect(await visibleNow(page)).toBe(732);
    });
  });

  test("below full height the body does not scroll: an upward drag expands", async ({
    page,
  }) => {
    await settled(page);
    const body = await page.locator(BODY).boundingBox();
    const x = body!.x + body!.width / 2;
    const y = body!.y + 100;
    await touchDrag(page, { x, y }, { x, y: y - 250 }, { hold: true });
    await expect.poll(() => visibleNow(page)).toBe(732);
    expect(await page.locator(BODY).evaluate((el) => el.scrollTop)).toBe(0);
  });

  test("a keyboard that covers the lower window lifts the sheet and reveals the field", async ({
    page,
  }) => {
    // Emulate the on-screen keyboard: a visual viewport 300px shorter.
    await page.evaluate(() => {
      const vv = window.visualViewport!;
      Object.defineProperty(vv, "height", {
        configurable: true,
        get: () => window.innerHeight - 300,
      });
      vv.dispatchEvent(new Event("resize"));
    });
    // The footer rides the lifted bottom edge, and the sheet is half of
    // what is left above the keyboard, not half of the window.
    const apply = page.getByRole("button", { name: "Apply" });
    await expect
      .poll(async () => {
        const box = await apply.boundingBox();
        return Math.round(box!.y + box!.height);
      })
      .toBe(MOBILE.height - 300);
    await expect.poll(async () => (await sheetBox(page)).top).toBe(240);
    // The page is shared with the next test.
    await page.evaluate(() => {
      // Restores the prototype getter.
      Reflect.deleteProperty(window.visualViewport!, "height");
    });
  });

  test("with reduced motion the sheet moves with no transition", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const duration = await page
      .locator(SHEET)
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe("0s");
    // And a drag clamps instead of stretching.
    await page.getByRole("slider", { name: "Resize sheet" }).focus();
    await page.keyboard.press("End");
    await expect.poll(() => visibleNow(page)).toBe(732);
    const { x, y } = await grabberPoint(page);
    await touchDrag(page, { x, y }, { x, y: y - 120 }, { hold: false });
    await expect.poll(() => visibleNow(page)).toBe(732);
  });
});

/**
 * Synthetic touch events on the body, for the engines CDP cannot reach. They
 * run the same handlers as a finger, though the browser does not scroll for
 * them.
 */
function bodyTouch(page: Page, path: { dy: number }[], { scrollTop = 0 } = {}) {
  return page.evaluate(
    async ({ path, scrollTop }) => {
      const body = document.querySelector<HTMLElement>(
        ".bx--bottom-sheet__body",
      )!;
      body.scrollTop = scrollTop;
      // WebKit's Touch and TouchEvent constructors are illegal outside iOS,
      // and the handlers only read `touches` and `cancelable`.
      const at = (y: number) => ({ clientX: 195, clientY: y });
      const send = (
        type: string,
        touches: { clientX: number; clientY: number }[],
      ) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, "touches", { value: touches });
        body.dispatchEvent(event);
        return event;
      };
      const start = 400;
      send("touchstart", [at(start)]);
      const prevented: boolean[] = [];
      for (const { dy } of path) {
        prevented.push(send("touchmove", [at(start + dy)]).defaultPrevented);
        await new Promise((r) => setTimeout(r, 16));
      }
      const during = Math.round(
        window.innerHeight -
          document.querySelector(".bx--bottom-sheet")!.getBoundingClientRect()
            .top,
      );
      await new Promise((r) => setTimeout(r, 200));
      send("touchend", []);
      return { prevented, during };
    },
    { path, scrollTop },
  );
}

test.describe("BottomSheet touch events on the body, in every engine", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/bottom-sheet.html");
    await page.getByTestId("open").click();
    await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
    await settled(page);
  });

  test("below full height an upward drag cancels the scroll and expands the sheet", async ({
    page,
  }) => {
    const { prevented } = await bodyTouch(
      page,
      [-10, -60, -120, -200, -260].map((dy) => ({ dy })),
    );
    expect(prevented.slice(1)).toEqual([true, true, true, true]);
    await expect.poll(() => visibleNow(page)).toBe(732);
  });

  test("at full height a drag down from the top moves the sheet, and one up scrolls", async ({
    page,
  }) => {
    await page.getByRole("slider", { name: "Resize sheet" }).focus();
    await page.keyboard.press("End");
    await expect.poll(() => visibleNow(page)).toBe(732);

    const up = await bodyTouch(
      page,
      [-20, -80].map((dy) => ({ dy })),
    );
    expect(up.prevented).toEqual([false, false]);
    expect(up.during).toBe(732);

    const down = await bodyTouch(
      page,
      [20, 100, 200, 260].map((dy) => ({ dy })),
    );
    expect(down.prevented.slice(1)).toEqual([true, true, true]);
    await expect.poll(() => visibleNow(page)).toBe(390);
  });
});

test.describe("BottomSheet modal without actions", () => {
  test("fits its content, and a scrim click closes it", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/bottom-sheet.html?variant=action");
    await page.getByTestId("open").click();
    await expect(page.getByTestId("share")).toBeVisible();
    // One snap point: no slider, a decorative grabber.
    await expect(page.getByRole("slider")).toHaveCount(0);
    const box = await sheetBox(page);
    expect(box.visible).toBeLessThan(260);
    await page.mouse.click(195, 100);
    await expect(page.locator(SHEET)).toHaveCount(0);
    await expect(page.getByTestId("log")).toHaveText("close:outside-click");
  });
});

test.describe("BottomSheet non-modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/bottom-sheet.html?variant=map");
    await expect(page.locator(SHEET)).toBeVisible();
  });

  test("is a complementary landmark that leaves the page usable", async ({
    page,
  }) => {
    await expect(
      page.getByRole("complementary", { name: "Nearby places" }),
    ).toBeVisible();
    await expect(page.locator(".bx--bottom-sheet__scrim")).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        document.body.classList.contains("bx--body--with-modal-open"),
      ),
    ).toBe(false);
    // Opens at peek, and the page behind still takes a click.
    expect((await sheetBox(page)).visible).toBe(120);
    await page.getByTestId("page-button").click();
    await expect(page.getByTestId("page-clicks")).toHaveText("1");
    await expect(page.locator(SHEET)).toBeVisible();
  });

  test("Escape and a drag below the peek do not close it", async ({ page }) => {
    await page.getByRole("slider", { name: "Resize sheet" }).focus();
    await page.keyboard.press("Escape");
    await expect(page.locator(SHEET)).toBeVisible();
    const { x, y } = await grabberPoint(page);
    await touchDrag(page, { x, y }, { x, y: y + 150 }, { hold: true });
    await expect.poll(() => visibleNow(page)).toBe(120);
    await expect(page.locator(".bx--bottom-sheet__close")).toHaveCount(0);
  });

  test("steps through peek, half and full by keyboard", async ({ page }) => {
    const grabber = page.getByRole("slider", { name: "Resize sheet" });
    await expect(grabber).toHaveAttribute("aria-valuetext", "Peek");
    await grabber.focus();
    await page.keyboard.press("ArrowUp");
    await expect(grabber).toHaveAttribute("aria-valuetext", "Half height");
    await page.keyboard.press("ArrowUp");
    await expect(grabber).toHaveAttribute("aria-valuetext", "Full height");
    await expect(page.getByTestId("snap")).toHaveText("full");
  });

  test("a flick goes to the next snap point in its direction", async ({
    page,
  }) => {
    const { x, y } = await grabberPoint(page);
    // About 1.2px/ms: past the fling speed, short of reaching full.
    await touchDrag(page, { x, y }, { x, y: y - 80 }, { steps: 4, stepMs: 16 });
    await expect.poll(() => visibleNow(page)).toBe(390);
    const g = await grabberPoint(page);
    await touchDrag(page, g, { x: g.x, y: g.y + 90 }, { steps: 3, stepMs: 8 });
    await expect.poll(() => visibleNow(page)).toBe(120);
  });
});

test.describe("BottomSheet at a wide width", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("a modal sheet is a centered dialog with no grabber", async ({
    page,
  }) => {
    await page.goto("/bottom-sheet.html");
    await page.getByTestId("open").click();
    const dialog = page.getByRole("dialog", { name: "Filters" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("slider")).toHaveCount(0);
    const box = await dialog.boundingBox();
    expect(Math.round(box!.width)).toBe(512);
    expect(Math.round(box!.x + box!.width / 2)).toBe(640);
    expect(Math.round(box!.y + box!.height / 2)).toBe(400);
    // The body scrolls inside the dialog.
    expect(
      await page
        .locator(BODY)
        .evaluate((el) => el.scrollHeight > el.clientHeight),
    ).toBe(true);
  });

  test("a non-modal sheet docks to the inline-end edge, and mirrors in RTL", async ({
    page,
  }) => {
    await page.goto("/bottom-sheet.html?variant=map");
    const sheet = page.locator(SHEET);
    await expect(sheet).toBeVisible();
    await expect(page.getByRole("slider")).toHaveCount(0);
    await expect(sheet).toHaveCSS("width", "384px");
    expect(Math.round((await sheet.boundingBox())!.x + 384)).toBe(1280);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    expect(Math.round((await sheet.boundingBox())!.x)).toBe(0);
  });

  test("stays a sheet when the breakpoint is false", async ({ page }) => {
    await page.goto("/bottom-sheet.html?stay-sheet");
    await page.getByTestId("open").click();
    await expect(
      page.getByRole("slider", { name: "Resize sheet" }),
    ).toBeVisible();
  });
});

test.describe("BottomSheet forced colors", () => {
  test("draws a border and a visible grabber", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/bottom-sheet.html");
    await page.getByTestId("open").click();
    await expect(page.locator(SHEET)).toBeVisible();
    await expect(page.locator(SHEET)).toHaveCSS("border-top-style", "solid");
    const bar = await page
      .locator(".bx--bottom-sheet__grabber")
      .evaluate((el) => getComputedStyle(el, "::before").backgroundColor);
    // CanvasText, not the Canvas the sheet is painted on.
    const canvas = await page
      .locator(SHEET)
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bar).not.toBe(canvas);
  });
});
