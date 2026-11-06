import AxeBuilder from "@axe-core/playwright";
import { type Page, test as touchTest } from "@playwright/test";
import { expect, test } from "./helpers/host";

const levelOf = async (page: Page) =>
  Number.parseInt(
    (await page
      .locator("section[aria-label='Image zoom'] .level")
      .textContent()) ?? "0",
    10,
  );

const count = (page: Page, name: string) =>
  page.getByTestId(`count-${name}`).textContent().then(Number);

const taskTexts = (page: Page) =>
  page.locator("[data-task] .text").allTextContents();

async function center(page: Page, selector: string) {
  await page
    .locator(selector)
    .first()
    .evaluate((node) => node.scrollIntoView({ block: "center" }));
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`no box for ${selector}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

/** A mouse drag with the moves spread over a few frames. */
async function dragMouse(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  return {
    release: () => page.mouse.up(),
  };
}

test.describe("gesture: mouse and keyboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/gesture.html");
  });

  test("reorders a task by dragging it, and puts it back on Escape", async ({
    page,
  }) => {
    const before = await taskTexts(page);
    const first = await center(page, "[data-task] .text");
    const row = page.locator("[data-task]").first();
    const rowBox = await row.boundingBox();
    if (!rowBox) throw new Error("no row");

    // Escape cancels the lifted row.
    const cancelled = await dragMouse(
      page,
      { x: first.x, y: first.y },
      { x: first.x, y: first.y + rowBox.height * 2 },
    );
    await expect(row).toHaveClass(/lifted/);
    await page.keyboard.press("Escape");
    await cancelled.release();
    expect(await taskTexts(page)).toEqual(before);
    await expect(page.locator(".lifted")).toHaveCount(0);

    // Released two rows down, it lands there.
    const moved = await dragMouse(
      page,
      { x: first.x, y: first.y },
      { x: first.x, y: first.y + rowBox.height * 2 },
    );
    await moved.release();
    expect(await taskTexts(page)).toEqual([
      before[1],
      before[2],
      before[0],
      ...before.slice(3),
    ]);
  });

  test("reorders from the keyboard and the buttons, which need no gesture", async ({
    page,
  }) => {
    const before = await taskTexts(page);
    const down = page.getByRole("button", { name: "Move down" }).first();
    await down.focus();
    await page.keyboard.press("Alt+ArrowDown");
    expect(await taskTexts(page)).toEqual([
      before[1],
      before[0],
      ...before.slice(2),
    ]);
    // Headless WebKit leaves the first row's disabled-state transition
    // running, and the click waits on it.
    await page
      .getByRole("button", { name: "Move up" })
      .nth(1)
      .click({ force: true });
    expect(await taskTexts(page)).toEqual(before);
  });

  test("dismisses a message by swiping with a mouse, or with its button", async ({
    page,
  }) => {
    const messages = page.locator(".message");
    await expect(messages).toHaveCount(4);
    const first = await center(page, ".message .body");
    const swipe = await dragMouse(
      page,
      { x: first.x + 40, y: first.y },
      { x: first.x - 160, y: first.y },
    );
    await swipe.release();
    await expect(messages).toHaveCount(3);

    await page
      .getByRole("button", { name: /Dismiss message from/ })
      .first()
      .click();
    await expect(messages).toHaveCount(2);
  });

  test("springs a short drag back", async ({ page }) => {
    const first = await center(page, ".message .body");
    const slow = await dragMouse(
      page,
      { x: first.x, y: first.y },
      { x: first.x - 30, y: first.y },
    );
    await slow.release();
    await expect(page.locator(".message")).toHaveCount(4);
    await expect
      .poll(() =>
        page
          .locator(".message")
          .first()
          .evaluate((node) => getComputedStyle(node).transform),
      )
      .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  });

  test("zooms the image by double click, keys, and Ctrl+wheel", async ({
    page,
  }) => {
    const image = await center(page, ".frame");
    expect(await levelOf(page)).toBe(100);

    await page.mouse.dblclick(image.x, image.y);
    await expect.poll(() => levelOf(page)).toBeGreaterThan(200);
    await page.mouse.dblclick(image.x, image.y);
    await expect.poll(() => levelOf(page)).toBe(100);

    await page.locator(".frame").focus();
    await page.keyboard.press("+");
    await expect.poll(() => levelOf(page)).toBe(150);
    await page.keyboard.press("-");
    await expect.poll(() => levelOf(page)).toBe(100);
    await page.keyboard.press("+");
    await page.keyboard.press("0");
    await expect.poll(() => levelOf(page)).toBe(100);

    await page.mouse.move(image.x, image.y);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -120);
    await page.keyboard.up("Control");
    await expect.poll(() => levelOf(page)).toBeGreaterThan(100);
  });

  test("pans a zoomed image with a mouse, and the zoom buttons work", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Zoom in" }).click();
    await page.getByRole("button", { name: "Zoom in" }).click();
    const frame = await center(page, ".frame");
    const transformOf = () =>
      page
        .locator(".layer")
        .evaluate((node) => (node as HTMLElement).style.transform);
    const before = await transformOf();
    const pan = await dragMouse(
      page,
      { x: frame.x, y: frame.y },
      { x: frame.x - 60, y: frame.y - 20 },
    );
    await pan.release();
    expect(await transformOf()).not.toBe(before);
  });

  test("does not start a gesture from a control inside the area", async ({
    page,
  }) => {
    const button = page.getByRole("button", { name: "Move down" }).first();
    const box = await button.boundingBox();
    if (!box) throw new Error("no button");
    const before = await taskTexts(page);
    await page.mouse.move(box.x + 4, box.y + 4);
    await page.mouse.down();
    await page.mouse.move(box.x + 4, box.y + 120, { steps: 6 });
    await expect(page.locator(".lifted")).toHaveCount(0);
    await page.mouse.up();
    expect(await taskTexts(page)).toEqual(before);
  });

  test("tells mouse, pen and touch apart and treats each as a press", async ({
    page,
  }) => {
    // Synthetic pointer events run the same recognizers in every engine.
    for (const pointerType of ["mouse", "pen", "touch"]) {
      await page.getByRole("button", { name: "Clear" }).click();
      await page.getByTestId("pad").evaluate(async (pad, type) => {
        const init = {
          pointerId: 7,
          pointerType: type,
          isPrimary: true,
          button: 0,
          bubbles: true,
          cancelable: true,
          clientX: 60,
          clientY: 60,
        };
        pad.dispatchEvent(new PointerEvent("pointerdown", init));
        document.dispatchEvent(new PointerEvent("pointerup", init));
        await new Promise((resolve) => setTimeout(resolve, 400));
      }, pointerType);
      await expect(page.getByTestId("log")).toContainText(
        `tap: ${pointerType}`,
      );
    }
  });

  test("blocks the context menu of a held finger, not a mouse's", async ({
    page,
  }) => {
    const result = await page.getByTestId("pad").evaluate((pad) => {
      const press = (pointerType: string) => {
        const init = {
          pointerId: 3,
          pointerType,
          isPrimary: true,
          button: 0,
          bubbles: true,
          cancelable: true,
        };
        pad.dispatchEvent(new PointerEvent("pointerdown", init));
        const menu = new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
        });
        pad.dispatchEvent(menu);
        document.dispatchEvent(new PointerEvent("pointerup", init));
        return menu.defaultPrevented;
      };
      return { touch: press("touch"), mouse: press("mouse") };
    });
    expect(result).toEqual({ touch: true, mouse: false });
  });

  test("passes axe, and in Gray 100", async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
    });
    const dark = await new AxeBuilder({ page }).analyze();
    expect(dark.violations).toEqual([]);
  });
});

test.describe("gesture: reduced motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/gesture.html");
  });

  test("removes a dismissed message without sliding it out", async ({
    page,
  }) => {
    const first = await center(page, ".message .body");
    const swipe = await dragMouse(
      page,
      { x: first.x + 40, y: first.y },
      { x: first.x - 160, y: first.y },
    );
    await swipe.release();
    await expect(page.locator(".message")).toHaveCount(3, { timeout: 100 });
    await expect(page.locator(".message.leaving")).toHaveCount(0);
  });

  test("stops a pan where the pointer left it, with no fling", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Zoom in" }).click();
    await page.getByRole("button", { name: "Zoom in" }).click();
    const frame = await center(page, ".frame");
    const layer = page.locator(".layer");
    const pan = await dragMouse(
      page,
      { x: frame.x + 100, y: frame.y },
      { x: frame.x - 100, y: frame.y },
    );
    await pan.release();
    const settled = await layer.evaluate(
      (node) => (node as HTMLElement).style.transform,
    );
    await page.waitForTimeout(250);
    expect(
      await layer.evaluate((node) => (node as HTMLElement).style.transform),
    ).toBe(settled);
  });
});

test.describe("gesture: layout direction", () => {
  test("swipes either way in right-to-left", async ({ page }) => {
    await page.goto("/gesture.html");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const first = await center(page, ".message .body");
    const swipe = await dragMouse(
      page,
      { x: first.x - 40, y: first.y },
      { x: first.x + 160, y: first.y },
    );
    await swipe.release();
    await expect(page.locator(".message")).toHaveCount(3);
  });
});

touchTest.describe("gesture: touch through CDP", () => {
  touchTest.use({ hasTouch: true });
  touchTest.beforeEach(({ browserName }) => {
    touchTest.skip(browserName !== "chromium", "CDP touch is Chromium only");
  });

  type Point = { x: number; y: number };

  async function touch(page: Page) {
    const cdp = await page.context().newCDPSession(page);
    const send = (type: string, points: Point[]) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: points.map((point, id) => ({ ...point, id })),
      });
    return {
      start: (...points: Point[]) => send("touchStart", points),
      move: (...points: Point[]) => send("touchMove", points),
      end: () => send("touchEnd", []),
      /** Move along a straight line, a frame apart. */
      async glide(from: Point, to: Point, steps: number, pause = 8) {
        for (let step = 1; step <= steps; step += 1) {
          await send("touchMove", [
            {
              x: from.x + ((to.x - from.x) * step) / steps,
              y: from.y + ((to.y - from.y) * step) / steps,
            },
          ]);
          await page.waitForTimeout(pause);
        }
      },
    };
  }

  const at = async (page: Page, selector: string, dy = 0) => {
    const { x, y } = await center(page, selector);
    return { x, y: y + dy };
  };

  touchTest.beforeEach(async ({ page }) => {
    await page.goto("/gesture.html");
  });

  touchTest("taps, and a double tap is not also a tap", async ({ page }) => {
    const finger = await touch(page);
    const spot = await at(page, "[data-testid=pad]");
    await finger.start(spot);
    await page.waitForTimeout(30);
    await finger.end();
    await expect.poll(() => count(page, "tap")).toBe(1);

    await finger.start(spot);
    await finger.end();
    await page.waitForTimeout(80);
    await finger.start(spot);
    await finger.end();
    await expect.poll(() => count(page, "doubletap")).toBe(1);
    await page.waitForTimeout(450);
    expect(await count(page, "tap")).toBe(1);
  });

  touchTest(
    "holds through a little finger movement, and not a lot",
    async ({ page }) => {
      const finger = await touch(page);
      const spot = await at(page, "[data-testid=pad]");

      await finger.start(spot);
      await finger.move({ x: spot.x + 3, y: spot.y + 2 });
      await page.waitForTimeout(250);
      await finger.move({ x: spot.x - 2, y: spot.y + 3 });
      await page.waitForTimeout(450);
      await expect.poll(() => count(page, "longpress")).toBe(1);
      await finger.end();
      expect(await count(page, "tap")).toBe(0);
      // A held finger would open the browser's menu on a phone.
      await expect(page.getByTestId("unprevented-menus")).toHaveText("0");

      await finger.start(spot);
      await finger.glide(spot, { x: spot.x + 40, y: spot.y }, 4, 20);
      await page.waitForTimeout(600);
      await finger.end();
      expect(await count(page, "longpress")).toBe(1);
    },
  );

  touchTest(
    "recognizes a quick flick as a swipe, and a slow drag as none",
    async ({ page }) => {
      const finger = await touch(page);
      const spot = await at(page, "[data-testid=pad]");

      await finger.start({ x: spot.x + 80, y: spot.y });
      await finger.glide(
        { x: spot.x + 80, y: spot.y },
        { x: spot.x - 60, y: spot.y },
        6,
        8,
      );
      await finger.end();
      await expect(page.getByTestId("log")).toContainText("swipe: left");

      await page.getByRole("button", { name: "Clear" }).click();
      await finger.start({ x: spot.x - 60, y: spot.y });
      await finger.glide(
        { x: spot.x - 60, y: spot.y },
        { x: spot.x + 60, y: spot.y },
        6,
        120,
      );
      await finger.end();
      await expect(page.getByTestId("log")).toContainText("pan:");
      expect(await count(page, "swipe")).toBe(0);
    },
  );

  touchTest("pinches an image larger, about the fingers", async ({ page }) => {
    const finger = await touch(page);
    const frame = await at(page, ".frame");
    expect(await levelOf(page)).toBe(100);
    const left = { x: frame.x - 30, y: frame.y };
    const right = { x: frame.x + 30, y: frame.y };
    await finger.start(left, right);
    for (let step = 1; step <= 6; step += 1) {
      await finger.move(
        { x: left.x - step * 15, y: left.y },
        { x: right.x + step * 15, y: right.y },
      );
      await page.waitForTimeout(16);
    }
    await finger.end();
    await expect.poll(() => levelOf(page)).toBeGreaterThan(250);
  });

  touchTest(
    "scrolls the area vertically and swipes it sideways",
    async ({ page }) => {
      const finger = await touch(page);
      const spot = await at(page, "[data-testid=scroller]");
      const scroller = page.getByTestId("scroller");
      const scrolled = () => scroller.evaluate((node) => node.scrollTop);
      expect(await scrolled()).toBe(0);

      // `touch-action: pan-y pinch-zoom` hands vertical drags to the browser.
      await finger.start(spot);
      await finger.glide(spot, { x: spot.x, y: spot.y - 90 }, 8, 12);
      await finger.end();
      await expect.poll(scrolled).toBeGreaterThan(20);
      await expect(page.getByTestId("strip-pan")).toHaveText("none");

      // The scroll glides on after the finger leaves.
      await page.waitForTimeout(1000);
      const before = await scrolled();
      const start = await at(page, "[data-testid=scroller]");
      await finger.start({ x: start.x + 90, y: start.y });
      await finger.glide(
        { x: start.x + 90, y: start.y },
        { x: start.x - 70, y: start.y },
        6,
        8,
      );
      await finger.end();
      await expect(page.getByTestId("strip-swipe")).toHaveText("left");
      expect(await scrolled()).toBe(before);
    },
  );

  touchTest(
    "holds a task, drags it, and lets the page keep still",
    async ({ page }) => {
      const finger = await touch(page);
      const before = await taskTexts(page);
      const row = page.locator("[data-task]").first();
      await row.scrollIntoViewIfNeeded();
      const rowBox = await row.boundingBox();
      if (!rowBox) throw new Error("no row");
      const from = {
        x: rowBox.x + rowBox.width / 3,
        y: rowBox.y + rowBox.height / 2,
      };
      const scrollY = await page.evaluate(() => window.scrollY);

      await finger.start(from);
      await page.waitForTimeout(650);
      await expect(row).toHaveClass(/lifted/);
      await finger.glide(
        from,
        { x: from.x, y: from.y + rowBox.height * 2 },
        8,
        16,
      );
      await finger.end();
      expect(await taskTexts(page)).toEqual([
        before[1],
        before[2],
        before[0],
        ...before.slice(3),
      ]);
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
    },
  );

  touchTest(
    "takes a real pen as a press, apart from touch and mouse",
    async ({ page }) => {
      const cdp = await page.context().newCDPSession(page);
      const spot = await at(page, "[data-testid=pad]");
      const pen = (type: string, x: number, y: number, buttons: number) =>
        cdp.send("Input.dispatchMouseEvent", {
          type,
          x,
          y,
          button: "left",
          buttons,
          clickCount: 1,
          pointerType: "pen",
        });

      await pen("mousePressed", spot.x, spot.y, 1);
      await pen("mouseReleased", spot.x, spot.y, 0);
      await expect(page.getByTestId("log")).toContainText("tap: pen");

      await pen("mousePressed", spot.x, spot.y, 1);
      for (let step = 1; step <= 5; step += 1) {
        await pen("mouseMoved", spot.x + step * 12, spot.y, 1);
      }
      await pen("mouseReleased", spot.x + 60, spot.y, 0);
      await expect(page.getByTestId("log")).toContainText("pan: pen dx 60");
    },
  );

  touchTest("scrolls past a task that was not held", async ({ page }) => {
    const finger = await touch(page);
    const before = await taskTexts(page);
    const row = page.locator("[data-task]").first();
    await row.scrollIntoViewIfNeeded();
    const rowBox = await row.boundingBox();
    if (!rowBox) throw new Error("no row");
    const from = {
      x: rowBox.x + rowBox.width / 3,
      y: rowBox.y + rowBox.height / 2,
    };
    const scrollY = await page.evaluate(() => window.scrollY);
    await finger.start(from);
    await finger.glide(from, { x: from.x, y: from.y - 120 }, 8, 12);
    await finger.end();
    expect(await taskTexts(page)).toEqual(before);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(scrollY + 20);
  });

  touchTest("dismisses a message with a finger", async ({ page }) => {
    const finger = await touch(page);
    const message = await at(page, ".message .body");
    await finger.start({ x: message.x + 60, y: message.y });
    await finger.glide(
      { x: message.x + 60, y: message.y },
      { x: message.x - 140, y: message.y },
      6,
      8,
    );
    await finger.end();
    await expect(page.locator(".message")).toHaveCount(3);
  });
});
