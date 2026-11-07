import type { CDPSession, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  clearSignature,
  countPointerMoves,
  exportedSize,
  getSignature,
  readPointerMoves,
} from "./helpers/signature-pad";

// Real input devices. These need a context of their own (touch, a device
// pixel ratio) and Chromium's DevTools protocol, so they run in Chromium.

const pad = (page: Page) =>
  page.getByRole("img", { name: /^Signature/ }).first();

async function padBox(page: Page) {
  const box = await pad(page).boundingBox();
  if (!box) throw new Error("pad is not visible");
  return box;
}

/** Ink pixels in a PNG data URL: the ones with any opacity. */
function inkPixels(page: Page, dataUrl: string) {
  return page.evaluate(async (url) => {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no canvas");
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
    return { count, width: image.width, height: image.height };
  }, dataUrl);
}

test.describe("SignaturePad with a mouse", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "uses CDP");

  test("keeps every sample of a fast stroke", async ({ page }) => {
    await page.goto("/signature-pad.html");
    const box = await padBox(page);
    await countPointerMoves(page);

    const samples = 160;
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    // A zigzag, so no sample is on the line between its neighbours and the
    // simplifier keeps them all. Sent back to back: several land in a frame.
    const moves: Promise<void>[] = [];
    for (let i = 1; i <= samples; i++) {
      moves.push(
        page.mouse.move(
          box.x + 20 + i * 3,
          box.y + box.height / 2 + (i % 2 ? -40 : 40),
        ),
      );
    }
    await Promise.all(moves);
    await page.mouse.up();

    const counts = await readPointerMoves(page);
    if (!counts) throw new Error("no pointer counts");
    expect(counts.samples).toBeGreaterThanOrEqual(samples);
    // Coalescing happened: more samples than events.
    expect(counts.events).toBeLessThan(counts.samples);

    const svg = (await getSignature(page))?.svg ?? "";
    // Each kept point is two curve anchors, one on each edge of the line.
    const anchors = (svg.match(/Q/g) ?? []).length;
    expect(anchors).toBeGreaterThanOrEqual((counts.samples - 2) * 2 * 0.9);
  });
});

test.describe("SignaturePad with a pen", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "uses CDP");

  async function penStroke(client: CDPSession, page: Page, force: number) {
    const box = await padBox(page);
    const y = box.y + box.height / 2;
    const base = {
      button: "left" as const,
      pointerType: "pen" as const,
      force,
    };
    await client.send("Input.dispatchMouseEvent", {
      ...base,
      type: "mousePressed",
      x: box.x + 40,
      y,
      buttons: 1,
      clickCount: 1,
    });
    for (let i = 1; i <= 24; i++) {
      // eslint-disable-next-line no-await-in-loop -- one sample at a time
      await client.send("Input.dispatchMouseEvent", {
        ...base,
        type: "mouseMoved",
        x: box.x + 40 + i * 10,
        y: y + Math.sin(i / 3) * 20,
        buttons: 1,
      });
    }
    await client.send("Input.dispatchMouseEvent", {
      ...base,
      type: "mouseReleased",
      x: box.x + 280,
      y,
      buttons: 0,
      clickCount: 1,
    });
  }

  test("draws a harder press thicker than a light one", async ({ page }) => {
    await page.goto("/signature-pad.html");
    const client = await page.context().newCDPSession(page);

    await penStroke(client, page, 0.1);
    const light = await inkPixels(page, (await getSignature(page))?.png ?? "");

    await clearSignature(page);
    await penStroke(client, page, 0.95);
    const hard = await inkPixels(page, (await getSignature(page))?.png ?? "");

    expect(light.count).toBeGreaterThan(0);
    expect(hard.count).toBeGreaterThan(light.count * 1.5);
  });
});

test.describe("SignaturePad on a touch screen", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "uses CDP");
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 700 },
  });

  async function swipe(
    client: CDPSession,
    from: { x: number; y: number },
    distance: number,
  ) {
    await client.send("Input.synthesizeScrollGesture", {
      x: from.x,
      y: from.y,
      yDistance: distance,
      speed: 800,
      gestureSourceType: "touch",
    });
  }

  test("draws in the pad without scrolling, and leaves the page alone elsewhere", async ({
    page,
  }) => {
    await page.goto("/signature-pad-touch.html");
    const client = await page.context().newCDPSession(page);
    await pad(page).scrollIntoViewIfNeeded();
    // Put the pad near the top so a swipe in it has room to move.
    await page.evaluate(() => {
      const target = document.querySelector('[role="img"]');
      if (target)
        window.scrollTo(
          0,
          target.getBoundingClientRect().top + window.scrollY - 120,
        );
    });
    const before = await page.evaluate(() => window.scrollY);
    const box = await padBox(page);

    // Up through the pad: the pad takes the finger.
    await swipe(
      client,
      { x: box.x + box.width / 2, y: box.y + box.height - 20 },
      -(box.height - 40),
    );
    await expect
      .poll(() => getSignature(page).then((v) => v?.type))
      .toBe("drawn");
    expect(await page.evaluate(() => window.scrollY)).toBe(before);

    // Only the pad takes the finger from the page: nothing around it does,
    // so a swipe there scrolls (a CDP swipe is unreliable on CI runners, so
    // this reads the property instead).
    const touchAction = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((node) => getComputedStyle(node).touchAction);
    expect(await touchAction('[role="img"]')).toBe("none");
    expect(await touchAction('[data-testid="above"]')).toBe("auto");
    expect(await touchAction(".bx--signature-pad__instructions")).toBe("auto");
  });
});

test.describe("SignaturePad on a high-DPI screen", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "uses CDP");
  test.use({ deviceScaleFactor: 2 });

  test("exports the same pixels as on any other screen", async ({ page }) => {
    await page.goto("/signature-pad.html");
    const box = await padBox(page);
    await page.mouse.move(box.x + 60, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 30, { steps: 8 });
    await page.mouse.move(box.x + 340, box.y + box.height - 30, { steps: 8 });
    await page.mouse.up();

    const value = await getSignature(page);
    const png = await inkPixels(page, value?.png ?? "");
    // pngScale is 2 on the pad's 600 by 200 units, whatever the screen.
    expect([png.width, png.height]).toEqual([1200, 400]);
    expect(png.count).toBeGreaterThan(500);

    const big = await exportedSize(page, 4);
    expect(big).toEqual([2400, 800]);
    expect(value?.svg).toContain('viewBox="0 0 600 200"');
  });
});
