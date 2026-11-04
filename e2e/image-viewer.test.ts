import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// The viewer moves a layer with a `transform`, so these read that transform
// back as a view: the scale and the offset of the image's top-left corner.
// The fixture's frame is 640 x 480 and its picture 2000 x 1500, so fit is 0.32.

type View = { scale: number; x: number; y: number };

async function view(page: Page): Promise<View> {
  const transform = await page
    .locator(".bx--image-viewer__layer")
    .evaluate((layer) => (layer as HTMLElement).style.transform);
  // Firefox and WebKit write a zero y offset as `translate(12px)`.
  const match = transform.match(
    /translate\((-?[\d.e-]+)px(?:, (-?[\d.e-]+)px)?\) scale\((.+)\)/,
  );
  if (!match) throw new Error(`no transform: "${transform}"`);
  return {
    x: Number(match[1]),
    y: Number(match[2] ?? 0),
    scale: Number(match[3]),
  };
}

async function open(page: Page, query = "") {
  await page.goto(`/image-viewer.html?${query}`);
  // A missing or held-back image never becomes ready.
  if (!query.includes("broken") && !query.includes("slow")) {
    await expect(page.locator(".bx--image-viewer--ready")).toBeVisible();
  }
}

const frame = (page: Page) => page.locator(".bx--image-viewer__frame");

test.describe("ImageViewer", () => {
  test("fits the picture, and names it for assistive technology", async ({
    page,
  }) => {
    await open(page);

    expect(await view(page)).toEqual({ scale: 0.32, x: 0, y: 0 });
    await expect(
      page.getByRole("img", { name: "Test picture" }),
    ).toHaveAttribute("aria-roledescription", "zoomable image");
    await expect(page.getByRole("button", { name: "Actual size" })).toHaveText(
      "32%",
    );
  });

  test("zooms about the cursor with Ctrl and the wheel, within the bounds", async ({
    page,
  }) => {
    await open(page);
    const box = await frame(page).boundingBox();
    if (!box) throw new Error("no frame");
    const at = { x: 160, y: 120 };

    await page.mouse.move(box.x + at.x, box.y + at.y);
    // The image point under the cursor at fit.
    const before = await view(page);
    const point = {
      x: (at.x - before.x) / before.scale,
      y: (at.y - before.y) / before.scale,
    };
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -200);
    await page.keyboard.up("Control");

    await expect
      .poll(async () => (await view(page)).scale)
      .toBeGreaterThan(0.32);
    const after = await view(page);
    expect((at.x - after.x) / after.scale).toBeCloseTo(point.x, 0);
    expect((at.y - after.y) / after.scale).toBeCloseTo(point.y, 0);

    await page.keyboard.down("Control");
    for (let notch = 0; notch < 40; notch++) {
      // biome-ignore lint/performance/noAwaitInLoops: one notch at a time
      await page.mouse.wheel(0, -300);
    }
    await page.keyboard.up("Control");
    await expect.poll(async () => (await view(page)).scale).toBe(4);
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeDisabled();
  });

  test("leaves a plain wheel to the page at fit, and zooms with wheel=always", async ({
    page,
  }) => {
    await open(page);
    await frame(page).hover();
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(100);
    expect((await view(page)).scale).toBe(0.32);

    await open(page, "wheel=always");
    await frame(page).hover();
    await page.mouse.wheel(0, -200);
    await expect
      .poll(async () => (await view(page)).scale)
      .toBeGreaterThan(0.32);
  });

  test("toggles fit and 100% on a double click, about the pointer", async ({
    page,
  }) => {
    await open(page);

    await frame(page).dblclick({ position: { x: 320, y: 240 } });
    await expect.poll(async () => (await view(page)).scale).toBe(1);
    // The image's center stays at the frame's center.
    expect(await view(page)).toMatchObject({ x: -680, y: -510 });
    await expect(page.getByTestId("zoom")).toHaveText("1");

    await frame(page).dblclick({ position: { x: 320, y: 240 } });
    await expect.poll(async () => (await view(page)).scale).toBe(0.32);
    await expect(page.getByTestId("zoom")).toHaveText("fit");
  });

  test("drags to pan and stays inside the image", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect
      .poll(async () => (await view(page)).scale)
      .toBeCloseTo(0.48, 2);
    const box = await frame(page).boundingBox();
    if (!box) throw new Error("no frame");
    const start = await view(page);

    await page.mouse.move(box.x + 300, box.y + 300);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 260, { steps: 4 });
    await page.mouse.up();
    // Released with no pause, it coasts a little, so allow for that.
    const panned = await view(page);
    expect(panned.x).toBeLessThan(start.x);
    expect(panned.y).toBeLessThan(start.y);

    await page.mouse.move(box.x + 300, box.y + 300);
    await page.mouse.down();
    await page.mouse.move(box.x - 2000, box.y - 2000 + 480, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(100);
    // The far corner of the image sits at the frame's far corner.
    await expect
      .poll(async () => view(page))
      .toMatchObject({ x: 640 - 2000 * 0.48, y: 480 - 1500 * 0.48 });
  });

  test("coasts after a fast drag, but not with reduced motion", async ({
    page,
  }) => {
    async function release() {
      const box = await frame(page).boundingBox();
      if (!box) throw new Error("no frame");
      await page.getByRole("button", { name: "Zoom in" }).click();
      await page.getByRole("button", { name: "Zoom in" }).click();
      await page.waitForTimeout(350);
      await page.mouse.move(box.x + 500, box.y + 400);
      await page.mouse.down();
      // A pause between moves, so the release has a measurable speed.
      await page.mouse.move(box.x + 480, box.y + 400);
      await page.waitForTimeout(12);
      await page.mouse.move(box.x + 460, box.y + 400);
      await page.waitForTimeout(12);
      await page.mouse.move(box.x + 440, box.y + 400);
      await page.mouse.up();
      const atRelease = await view(page);
      await page.waitForTimeout(250);
      return { atRelease, later: await view(page) };
    }

    await open(page);
    const coasting = await release();
    expect(coasting.later.x).toBeLessThan(coasting.atRelease.x);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    const still = await release();
    expect(still.later).toEqual(still.atRelease);
  });

  test("does not animate a zoom with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);

    await page.getByRole("button", { name: "Zoom in" }).click();

    // No transition runs, so the view is at its target at once.
    expect((await view(page)).scale).toBeCloseTo(0.48, 2);
    await expect(page.locator(".bx--image-viewer__layer")).not.toHaveClass(
      /--animating/,
    );
  });

  test("promotes the layer only while it moves", async ({ page }) => {
    await open(page);
    const layer = page.locator(".bx--image-viewer__layer");
    const willChange = () =>
      layer.evaluate((el) => getComputedStyle(el).willChange);

    expect(await willChange()).toBe("auto");
    // Read in the click's own task, before the settle timer can run.
    const during = await page
      .getByRole("button", { name: "Zoom in" })
      .evaluate((button, selector) => {
        button.click();
        const el = document.querySelector(selector);
        return el ? getComputedStyle(el).willChange : "";
      }, ".bx--image-viewer__layer");
    expect(during).toBe("transform");
    await expect.poll(willChange).toBe("auto");
  });

  test("zooms and pans from the keyboard", async ({ page }) => {
    await open(page);
    await frame(page).focus();

    await page.keyboard.press("+");
    await expect
      .poll(async () => (await view(page)).scale)
      .toBeCloseTo(0.48, 2);
    const zoomed = await view(page);
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await view(page)).x).toBeLessThan(zoomed.x);
    await page.keyboard.press("-");
    await expect.poll(async () => (await view(page)).scale).toBe(0.32);
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await view(page)).scale).toBe(1);
    await page.keyboard.press("0");
    await expect.poll(async () => (await view(page)).scale).toBe(0.32);
    await expect(page.getByTestId("zoomed")).toHaveText("false");
  });

  test("follows a zoom set from outside", async ({ page }) => {
    await open(page);

    await page.getByTestId("set-zoom").click();

    await expect.poll(async () => (await view(page)).scale).toBe(2);
    await expect(page.getByTestId("zoomed")).toHaveText("true");
  });

  test("announces the zoom level", async ({ page }) => {
    await open(page);

    await page.getByRole("button", { name: "Actual size" }).click();

    await expect(page.getByRole("status")).toHaveText("Zoom 100%");
  });

  test("lays the picture out again when the frame resizes", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() => {
      const frame = document.querySelector(".bx--image-viewer")
        ?.parentElement as HTMLElement;
      frame.style.width = "320px";
      frame.style.height = "240px";
    });

    await expect.poll(async () => (await view(page)).scale).toBe(0.16);
  });

  test("shows a skeleton while loading, then the picture", async ({ page }) => {
    await open(page, "slow");
    await page.route("**/slow.svg", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="teal"/></svg>',
      });
    });

    await page.evaluate(() => window.setImageSrc("/slow.svg"));

    await expect(page.locator(".bx--skeleton__placeholder")).toBeVisible();
    await expect(page.locator(".bx--image-viewer--ready")).toBeVisible();
    await expect(page.locator(".bx--skeleton__placeholder")).toHaveCount(0);
    expect((await view(page)).scale).toBe(0.8);
  });

  test("falls back to a message and a retry when the image is missing", async ({
    page,
  }) => {
    await open(page, "broken");
    await expect(
      page.getByText("The image could not be loaded."),
    ).toBeVisible();

    // The frame stops being an image region, so the retry button is reachable.
    await expect(
      page.getByRole("group", { name: "Test picture" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeDisabled();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await open(page);

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no violations while loading or broken", async ({ page }) => {
    await open(page, "broken");
    await expect(
      page.getByText("The image could not be loaded."),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});

test.describe("ImageViewer pinch", () => {
  test.use({ hasTouch: true });

  test("pinches to zoom about the midpoint, and drags with one finger", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "CDP touch emulation");
    await open(page);
    const box = await frame(page).boundingBox();
    if (!box) throw new Error("no frame");
    const cdp = await page.context().newCDPSession(page);
    const mid = { x: box.x + 320, y: box.y + 240 };
    const touch = (spread: number) => [
      { x: mid.x - spread, y: mid.y, id: 1 },
      { x: mid.x + spread, y: mid.y, id: 2 },
    ];

    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: touch(40),
    });
    for (const spread of [60, 80, 100, 120]) {
      // biome-ignore lint/performance/noAwaitInLoops: touch moves are ordered
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: touch(spread),
      });
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });

    // Spread 40 to 120 is three times the distance.
    await expect
      .poll(async () => (await view(page)).scale)
      .toBeCloseTo(0.32 * 3, 2);
    // The midpoint stayed over the same image point: the image center.
    const pinched = await view(page);
    expect((320 - pinched.x) / pinched.scale).toBeCloseTo(1000, 0);
    expect((240 - pinched.y) / pinched.scale).toBeCloseTo(750, 0);

    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: mid.x, y: mid.y, id: 1 }],
    });
    for (const dx of [-20, -40, -60]) {
      // biome-ignore lint/performance/noAwaitInLoops: touch moves are ordered
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: mid.x + dx, y: mid.y, id: 1 }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect.poll(async () => (await view(page)).x).toBeLessThan(pinched.x);
  });

  test("toggles on a double tap", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "CDP touch emulation");
    await open(page);
    const box = await frame(page).boundingBox();
    if (!box) throw new Error("no frame");

    const cdp = await page.context().newCDPSession(page);
    for (const nudge of [0, 2]) {
      const touchPoints = [{ x: box.x + 320 + nudge, y: box.y + 200, id: 1 }];
      // biome-ignore lint/performance/noAwaitInLoops: the taps are ordered
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints,
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    }

    await expect.poll(async () => (await view(page)).scale).toBe(1);
  });
});

test.describe("ImageViewer in other conditions", () => {
  test("keeps the picture's own left and right in a right-to-left page", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await frame(page).dblclick({ position: { x: 100, y: 100 } });
    await expect.poll(async () => (await view(page)).scale).toBe(1);
    const box = await frame(page).boundingBox();
    const controls = await page
      .locator(".bx--image-viewer__controls")
      .boundingBox();
    if (!box || !controls) throw new Error("no boxes");
    // The zoom was anchored 100px in from the left edge, in either direction.
    expect((100 - (await view(page)).x) / 1).toBeCloseTo((100 - 0) / 0.32, 0);
    // The controls moved to the other end of the frame.
    expect(controls.x - box.x).toBeLessThan(box.width / 2);
  });

  test("keeps its controls readable in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);

    const style = await page
      .locator(".bx--image-viewer__controls")
      .evaluate((el) => {
        const s = getComputedStyle(el);
        const probe = document.createElement("div");
        probe.style.backgroundColor = "Canvas";
        document.body.append(probe);
        const canvas = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return {
          background: s.backgroundColor,
          canvas,
          borderStyle: s.borderTopStyle,
          borderWidth: s.borderTopWidth,
          borderColor: s.borderTopColor,
        };
      });
    expect(style.background).toBe(style.canvas);
    expect(style.borderStyle).toBe("solid");
    expect(style.borderColor).not.toBe(style.background);

    const ring = await frame(page).evaluate((el) => {
      (el as HTMLElement).focus();
      const s = getComputedStyle(el);
      return `${s.outlineStyle} ${s.outlineWidth}`;
    });
    expect(ring).not.toMatch(/^none/);
  });
});
