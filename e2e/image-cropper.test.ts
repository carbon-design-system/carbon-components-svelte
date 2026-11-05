import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { test as playwrightTest } from "@playwright/test";
import { containsRect, rotatedSize } from "../src/utils/image-crop.js";
import { expect, test } from "./helpers/host";

// The fixture draws four colored quadrants when a test runs: top left red,
// top right green, bottom left blue, bottom right yellow, 600 x 400 unless a
// query says otherwise. The stage is 640 x 384, so in "image" mode a square
// frame is 336 px and the starting crop is 400 x 400 at x = 100, a scale of
// 0.84. In "box" mode the picture fits at the same 0.84.

declare global {
  interface Window {
    cropperTest: {
      toBlob: (options?: unknown) => Promise<Blob>;
      getData: () => Crop | null;
      reset: () => void;
      rotateBy: (degrees: number) => void;
      flip: (axis: "horizontal" | "vertical") => void;
      setValue: (value: Crop) => void;
      exportPixels: (
        options: unknown,
        points: ReadonlyArray<[number, number]>,
      ) => Promise<{
        type: string;
        size: number;
        width: number;
        height: number;
        pixels: number[][];
      }>;
      exportError: (
        options: unknown,
      ) => Promise<{ name: string; code: string; message: string } | null>;
      makePng: (width: number, height: number) => Promise<string>;
    };
  }
}

type Crop = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  flipX: boolean;
  flipY: boolean;
};

const RED = [255, 0, 0];
const GREEN = [0, 200, 0];
const BLUE = [0, 0, 255];
const YELLOW = [255, 255, 0];

async function open(page: Page, query = "") {
  await page.goto(`/image-cropper.html?${query}`);
  const settled =
    query.includes("broken") ||
    query.includes("heic") ||
    query.includes("cross");
  await expect(page.getByTestId("status")).toHaveText(
    settled ? /ready|error/ : "ready",
  );
}

async function crop(page: Page): Promise<Crop> {
  return JSON.parse((await page.getByTestId("value").textContent()) ?? "null");
}

const stage = (page: Page) => page.getByRole("group", { name: "Crop image" });

async function centerOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("no box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** The quadrants in order: top left, top right, bottom left, bottom right. */
const CORNERS: Array<[number, number]> = [
  [0.27, 0.27],
  [0.73, 0.27],
  [0.27, 0.73],
  [0.73, 0.73],
];

function exportedCorners(page: Page, options: Record<string, unknown> = {}) {
  return page.evaluate(
    ([opts, points]) => window.cropperTest.exportPixels(opts, points),
    [options, CORNERS] as const,
  );
}

function expectColors(pixels: number[][], colors: number[][]) {
  pixels.forEach((pixel, index) => {
    colors[index].forEach((channel, i) => {
      expect(
        Math.abs(pixel[i] - channel),
        `corner ${index} channel ${i} is ${pixel}, expected ${colors[index]}`,
      ).toBeLessThanOrEqual(45);
    });
  });
}

test.describe("ImageCropper: image mode", () => {
  test("starts with the largest crop, named and described", async ({
    page,
  }) => {
    await open(page);
    expect(await crop(page)).toEqual({
      x: 100,
      y: 0,
      width: 400,
      height: 400,
      rotate: 0,
      flipX: false,
      flipY: false,
    });
    await expect(stage(page)).toHaveAttribute(
      "aria-roledescription",
      "image cropper",
    );
    await expect(stage(page)).toHaveAttribute("tabindex", "0");
    const described = await stage(page).getAttribute("aria-describedby");
    await expect(page.locator(`[id="${described}"]`)).toContainText(
      "Arrow keys move the image",
    );
  });

  test("drags the image under the frame and clamps at the edge", async ({
    page,
  }) => {
    await open(page);
    const from = await centerOf(stage(page));
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    // Dragging the image left shows more of its right: x grows by 42 / 0.84.
    await page.mouse.move(from.x - 42, from.y, { steps: 4 });
    await page.mouse.up();
    expect((await crop(page)).x).toBe(150);

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x - 300, from.y, { steps: 4 });
    await page.mouse.up();
    expect((await crop(page)).x).toBe(200);
  });

  test("shows the rule-of-thirds grid while dragging only", async ({
    page,
  }) => {
    await open(page);
    const grid = page.locator(".bx--image-cropper__grid");
    await expect(grid).toHaveCSS("opacity", "0");
    const from = await centerOf(stage(page));
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x - 10, from.y, { steps: 2 });
    await expect(grid).toHaveCSS("opacity", "1");
    await page.mouse.up();
    await expect(grid).toHaveCSS("opacity", "0");
  });

  test("zooms about the cursor with Ctrl and the wheel", async ({ page }) => {
    await open(page);
    const before = await crop(page);
    const at = await centerOf(stage(page));
    await page.mouse.move(at.x, at.y);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -200);
    await page.keyboard.up("Control");
    await expect
      .poll(async () => (await crop(page)).width)
      .toBeLessThan(before.width - 20);
    const after = await crop(page);
    expect(after.width).toBe(after.height);
    // The centre of the frame stays on the same point of the image.
    expect(after.x + after.width / 2).toBeCloseTo(
      before.x + before.width / 2,
      -1,
    );
  });

  test("leaves a plain wheel to the page", async ({ page }) => {
    await open(page);
    const before = await crop(page);
    const at = await centerOf(stage(page));
    await page.mouse.move(at.x, at.y);
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(300);
    expect(await crop(page)).toEqual(before);
  });

  test("moves, resizes, zooms and turns from the keyboard", async ({
    page,
  }) => {
    await open(page);
    await stage(page).focus();

    // An arrow moves the image, so the crop goes the other way: 8 px / 0.84.
    await page.keyboard.press("ArrowLeft");
    expect((await crop(page)).x).toBe(110);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect((await crop(page)).x).toBe(90);

    // Shift and an arrow change the size of the crop, about its center.
    await page.keyboard.press("Shift+ArrowDown");
    const smaller = await crop(page);
    expect(smaller.width).toBe(smaller.height);
    expect(smaller.width).toBeLessThan(400);
    await page.keyboard.press("Shift+ArrowUp");
    // A step is 16 screen px, and the screen scale changed in between.
    expect((await crop(page)).width).toBeGreaterThan(397);

    await page.keyboard.press("+");
    const zoomed = (await crop(page)).width;
    expect(zoomed).toBeGreaterThan(361);
    expect(zoomed).toBeLessThan(367);
    await page.keyboard.press("-");
    expect((await crop(page)).width).toBeGreaterThan(395);

    await page.keyboard.press("]");
    expect((await crop(page)).rotate).toBe(90);
    await page.keyboard.press("[");
    await page.keyboard.press("[");
    expect((await crop(page)).rotate).toBe(-90);
  });

  test("announces the crop's size and position", async ({ page }) => {
    await open(page);
    await stage(page).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("status")).toHaveText(
      "Crop 400 by 400 pixels, 110 from the left and 0 from the top",
    );
  });

  test("keeps the frame full as the image turns, and the crop inside it", async ({
    page,
  }) => {
    await open(page);
    const straighten = page.getByRole("slider", { name: "Straighten" });
    await straighten.focus();
    let current = 0;
    for (const angle of [5, 17, 30, 45, -30, -45]) {
      // Arrow keys step the slider by one degree.
      const key = angle > current ? "ArrowRight" : "ArrowLeft";
      for (let i = 0; i < Math.abs(angle - current); i++) {
        // biome-ignore lint/performance/noAwaitInLoops: key presses are ordered
        await page.keyboard.press(key);
      }
      current = angle;
      await expect.poll(async () => (await crop(page)).rotate).toBe(angle);
      const data = await crop(page);
      expect(
        containsRect({ width: 600, height: 400 }, data.rotate, data, 1.5),
        `crop ${JSON.stringify(data)} leaves the image at ${angle} degrees`,
      ).toBe(true);
      const bounds = rotatedSize({ width: 600, height: 400 }, data.rotate);
      expect(data.x + data.width).toBeLessThanOrEqual(Math.ceil(bounds.width));
    }
  });

  test("cuts the crop out with the turn and flips applied", async ({
    page,
  }) => {
    await open(page);
    // The crop is the middle 400 x 400: each quadrant shows in its corner.
    let out = await exportedCorners(page);
    expect(out.width).toBe(400);
    expectColors(out.pixels, [RED, GREEN, BLUE, YELLOW]);

    await page.evaluate(() => window.cropperTest.flip("horizontal"));
    out = await exportedCorners(page);
    expectColors(out.pixels, [GREEN, RED, YELLOW, BLUE]);

    await page.evaluate(() => window.cropperTest.reset());
    await page.evaluate(() => window.cropperTest.rotateBy(90));
    out = await exportedCorners(page);
    // Clockwise: red moves to the top right, blue to the top left.
    expectColors(out.pixels, [BLUE, RED, YELLOW, GREEN]);
    expect((await crop(page)).rotate).toBe(90);

    // A flip is as it appears on screen, whatever the turn.
    await page.evaluate(() => window.cropperTest.flip("horizontal"));
    out = await exportedCorners(page);
    expectColors(out.pixels, [RED, BLUE, GREEN, YELLOW]);

    await page.evaluate(() => window.cropperTest.flip("vertical"));
    out = await exportedCorners(page);
    expectColors(out.pixels, [GREEN, YELLOW, RED, BLUE]);
  });

  test("scales and encodes the output", async ({ page }) => {
    await open(page);
    const png = await exportedCorners(page, { width: 100 });
    expect(png.type).toBe("image/png");
    expect(png.width).toBe(100);
    expect(png.height).toBe(100);
    const jpeg = await exportedCorners(page, {
      type: "image/jpeg",
      quality: 0.8,
      width: 200,
    });
    expect(jpeg.type).toBe("image/jpeg");
    expect(jpeg.width).toBe(200);
    // Safari can't encode WebP and writes PNG: the blob says which.
    const webp = await exportedCorners(page, { type: "image/webp" });
    expect(["image/webp", "image/png"]).toContain(webp.type);
  });

  test("applies a crop set from outside", async ({ page }) => {
    await open(page);
    await page.evaluate(() =>
      window.cropperTest.setValue({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        rotate: 0,
        flipX: false,
        flipY: false,
      }),
    );
    await expect.poll(async () => (await crop(page)).width).toBe(200);
    expect(await crop(page)).toMatchObject({ x: 0, y: 0, height: 200 });
    // Setting the crop is not a user change.
    await expect(page.getByTestId("changes")).toHaveText("0");
    const out = await exportedCorners(page);
    expectColors(out.pixels, [RED, RED, RED, RED]);
  });

  test("never zooms below the minimum output size", async ({ page }) => {
    await open(page, "minw=300&minh=300");
    await stage(page).focus();
    for (let i = 0; i < 12; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: key presses are ordered
      await page.keyboard.press("+");
    }
    expect((await crop(page)).width).toBe(300);
    const zoom = page.getByRole("slider", { name: "Zoom" });
    await expect(zoom).toHaveAttribute("aria-valuemax", "1.33");
  });

  test("says when the image is smaller than the minimum", async ({ page }) => {
    await open(page, "w=200&h=150&minw=300&minh=300");
    await expect(page.locator(".bx--image-cropper__helper--error")).toHaveText(
      "This image is smaller than the 300 × 300 minimum.",
    );
  });

  test("honors a ratio and the circle shape", async ({ page }) => {
    await open(page, "aspect=1.5&shape=circle");
    expect(await crop(page)).toMatchObject({ width: 400, height: 400 });
    await expect(page.locator(".bx--image-cropper__frame")).toHaveCSS(
      "border-radius",
      "50%",
    );
    await page.goto("/image-cropper.html?aspect=2");
    await expect(page.getByTestId("status")).toHaveText("ready");
    expect(await crop(page)).toMatchObject({ width: 600, height: 300 });
  });
});

test.describe("ImageCropper: box mode", () => {
  test("shows the handles as buttons and moves the box by dragging", async ({
    page,
  }) => {
    await open(page, "mode=box&aspect=free");
    expect(await crop(page)).toMatchObject({
      x: 60,
      y: 40,
      width: 480,
      height: 320,
    });
    const handles = page.locator("[data-handle]");
    await expect(handles).toHaveCount(8);
    await expect(
      page.getByRole("button", { name: "Resize top left" }),
    ).toHaveAttribute("aria-roledescription", "resize handle");

    const frame = await centerOf(page.locator(".bx--image-cropper__frame"));
    await page.mouse.move(frame.x, frame.y);
    await page.mouse.down();
    await page.mouse.move(frame.x - 42, frame.y - 21, { steps: 4 });
    await page.mouse.up();
    // Moving the box by 42 px is 50 source px at 0.84.
    expect(await crop(page)).toMatchObject({ x: 10, y: 15, width: 480 });

    // It stops at the image's edge.
    await page.mouse.move(frame.x - 42, frame.y - 21);
    await page.mouse.down();
    await page.mouse.move(frame.x - 300, frame.y - 180, { steps: 4 });
    await page.mouse.up();
    expect(await crop(page)).toMatchObject({ x: 0, y: 0 });
  });

  test("resizes from a handle, and a corner slides along an edge", async ({
    page,
  }) => {
    await open(page, "mode=box&aspect=free");
    const se = await centerOf(page.locator("[data-handle=se]"));
    await page.mouse.move(se.x, se.y);
    await page.mouse.down();
    await page.mouse.move(se.x + 500, se.y + 20, { steps: 5 });
    await page.mouse.up();
    // Width ran into the image's right edge; height kept going.
    const data = await crop(page);
    expect(data.x + data.width).toBe(600);
    expect(data.height).toBeGreaterThan(330);
    expect(data.y).toBe(40);
  });

  test("keeps a locked ratio while a handle moves", async ({ page }) => {
    await open(page, "mode=box&aspect=1.5");
    const nw = await centerOf(page.locator("[data-handle=nw]"));
    await page.mouse.move(nw.x, nw.y);
    await page.mouse.down();
    await page.mouse.move(nw.x + 60, nw.y + 10, { steps: 4 });
    await page.mouse.up();
    const data = await crop(page);
    expect(data.width / data.height).toBeCloseTo(1.5, 1);
    expect(data.width).toBeLessThan(480);
  });

  test("resizes a handle from the keyboard, with Shift for a larger step", async ({
    page,
  }) => {
    await open(page, "mode=box&aspect=free");
    const before = await crop(page);
    await page.getByRole("button", { name: "Resize right" }).focus();
    await page.keyboard.press("ArrowRight");
    const step = (await crop(page)).width - before.width;
    expect(step).toBe(10);
    await page.keyboard.press("Shift+ArrowRight");
    // Ten times the step is more than the room left, so the edge stops it.
    expect((await crop(page)).x + (await crop(page)).width).toBe(600);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    expect((await crop(page)).x).toBe(60);
    // The edge handles only move on their own axis.
    expect((await crop(page)).height).toBe(320);
  });

  test("moves and resizes the box from the keyboard", async ({ page }) => {
    await open(page, "mode=box&aspect=free");
    await stage(page).focus();
    await page.keyboard.press("ArrowRight");
    expect((await crop(page)).x).toBe(70);
    await page.keyboard.press("ArrowDown");
    expect((await crop(page)).y).toBe(50);
    // Shift and Right widen it alone; Shift and Up make it taller.
    await page.keyboard.press("Shift+ArrowRight");
    const wide = await crop(page);
    expect(wide.width).toBeGreaterThan(480);
    expect(wide.height).toBe(320);
    await page.keyboard.press("Shift+ArrowUp");
    expect((await crop(page)).height).toBeGreaterThan(320);
  });

  test("switches the ratio from the presets", async ({ page }) => {
    await open(page, "mode=box&aspect=free");
    const group = page.getByRole("toolbar", { name: "Aspect ratio" });
    await group.getByRole("button", { name: "1:1" }).click();
    const square = await crop(page);
    expect(square.width).toBe(square.height);
    await group.getByRole("button", { name: "16:9" }).click();
    const wide = await crop(page);
    expect(wide.width / wide.height).toBeCloseTo(16 / 9, 1);
    await expect(group.getByRole("button", { name: "16:9" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await group.getByRole("button", { name: "Free" }).click();
    // Free keeps what it has.
    const free = await crop(page);
    expect(free.width / free.height).toBeCloseTo(16 / 9, 1);
  });

  test("turns a free box with the image", async ({ page }) => {
    await open(page, "mode=box&aspect=free");
    await page.getByRole("button", { name: "Rotate right" }).click();
    expect(await crop(page)).toMatchObject({
      rotate: 90,
      width: 320,
      height: 480,
    });
  });
});

test.describe("ImageCropper: sources", () => {
  test("reads the EXIF orientation of a JPEG", async ({ page }) => {
    // Orientation 6: display the stored 300 x 200 picture turned 90 degrees
    // clockwise, 200 x 300. A browser that ignored it would report 300 x 200.
    await open(page, "w=300&h=200&exif=6");
    await expect(page.getByTestId("loads")).toContainText(
      '"width":200,"height":300',
    );
    const out = await exportedCorners(page);
    expect(out.width).toBe(200);
    expectColors(out.pixels, [BLUE, RED, YELLOW, GREEN]);
  });

  test("downscales a large image once, and still exports the original", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    // WebKit's canvas holds at most 16,777,216 pixels, which a 6000 x 4000
    // test picture is over, so it gets a smaller large picture.
    const [width, height] =
      testInfo.project.name === "webkit" ? [4000, 3600] : [6000, 4000];
    await open(page, `w=${width}&h=${height}&type=jpeg`);
    await expect(page.getByTestId("loads")).toContainText(
      `"width":${width},"height":${height},"downscaled":true`,
    );
    const canvas = page.locator(".bx--image-cropper__image");
    // The editor holds the downscaled bitmap, not the full decode.
    expect(await canvas.evaluate((el) => (el as HTMLCanvasElement).width)).toBe(
      2048,
    );
    expect(await crop(page)).toMatchObject({
      x: (width - height) / 2,
      width: height,
      height,
    });
    const out = await exportedCorners(page, { width: 400 });
    expect(out.width).toBe(400);
    expectColors(out.pixels, [RED, GREEN, BLUE, YELLOW]);
  });

  test("reports a file it can't open, and HEIC by name", async ({ page }) => {
    await open(page, "broken");
    await expect(page.getByRole("alert")).toHaveText(
      "The image could not be loaded.",
    );
    await expect(page.getByTestId("errors")).toContainText('"code":"load"');
    await expect(stage(page)).not.toHaveAttribute("tabindex", "0");

    await open(page, "heic");
    await expect(page.getByRole("alert")).toContainText("HEIC");
    await expect(page.getByTestId("errors")).toContainText(
      '"code":"unsupported"',
    );
  });

  test("fails an export of a cross-origin image with a tainted error", async ({
    page,
  }) => {
    await open(page);
    const base64 = await page.evaluate(() =>
      window.cropperTest.makePng(60, 40),
    );
    // No CORS headers, so the browser draws it but won't let it be read back.
    await page.route("http://other.test/photo.png", (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/png",
        body: Buffer.from(base64, "base64"),
      }),
    );
    await page.route("http://other.test/cors.png", (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/png",
        headers: { "access-control-allow-origin": "*" },
        body: Buffer.from(base64, "base64"),
      }),
    );
    await open(page, "cross=http://other.test/photo.png&nocors");
    await expect(page.getByTestId("status")).toHaveText("ready");
    expect(
      await page.evaluate(() => window.cropperTest.exportError({})),
    ).toMatchObject({
      name: "ImageCropError",
      code: "tainted",
    });
    // A server that sends CORS headers, read with `crossorigin="anonymous"`.
    await open(page, "cross=http://other.test/cors.png");
    await expect(page.getByTestId("status")).toHaveText("ready");
    expect(
      await page.evaluate(() => window.cropperTest.exportError({})),
    ).toBeNull();
  });
});

test.describe("ImageCropper: appearance", () => {
  test("has no motion to turn off under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "grid=always");
    await expect(page.locator(".bx--image-cropper__grid")).toHaveCSS(
      "transition-duration",
      "0s",
    );
    await expect(page.locator(".bx--image-cropper__image")).toHaveCSS(
      "transition-duration",
      "0s",
    );
  });

  test("keeps the picture left to right in RTL while the controls mirror", async ({
    page,
  }) => {
    await open(page, "mode=box&aspect=free");
    const before = await crop(page);
    const buttonLeft = async () =>
      (await page.getByRole("button", { name: "Rotate left" }).boundingBox())
        ?.x ?? 0;
    const ltrLeft = await buttonLeft();
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await expect(stage(page)).toHaveCSS("direction", "ltr");
    // The box did not move, and a right arrow is still to the right.
    expect(await crop(page)).toEqual(before);
    await stage(page).focus();
    await page.keyboard.press("ArrowRight");
    expect((await crop(page)).x).toBe(before.x + 10);
    // The row of controls swapped sides.
    expect(await buttonLeft()).toBeGreaterThan(ltrLeft + 100);
    await expect(
      page.getByRole("button", { name: "Resize left" }),
    ).toBeVisible();
  });

  test("draws the frame and handles with system colors when forced", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, "mode=box&aspect=free");
    const frame = page.locator(".bx--image-cropper__frame");
    await expect(frame).toHaveCSS("box-shadow", "none");
    await expect(frame).toHaveCSS("border-top-width", "1px");
    // `Canvas` outline outside a `CanvasText` border: visible on any image.
    await expect(frame).toHaveCSS("outline-style", "solid");
    const handle = page.locator("[data-handle=se]");
    const fill = await handle.evaluate(
      (el) => getComputedStyle(el, "::before").backgroundColor,
    );
    const border = await handle.evaluate(
      (el) => getComputedStyle(el, "::before").borderTopColor,
    );
    expect(fill).not.toBe(border);
  });
});

test.describe("ImageCropper: disabled", () => {
  test("ignores the pointer and the keys", async ({ page }) => {
    await open(page, "disabled");
    await expect(stage(page)).toHaveAttribute("aria-disabled", "true");
    const before = await crop(page);
    const from = await centerOf(stage(page));
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x - 60, from.y, { steps: 3 });
    await page.mouse.up();
    expect(await crop(page)).toEqual(before);
    await expect(
      page.getByRole("button", { name: "Rotate right" }),
    ).toBeDisabled();
  });
});

test.describe("ImageCropper: accessibility", () => {
  for (const [name, query] of [
    ["image mode", ""],
    ["box mode", "mode=box&aspect=free&grid=always"],
    ["circle", "shape=circle"],
    ["error", "broken"],
  ] as const) {
    test(`has no axe violations: ${name}`, async ({ page }) => {
      await open(page, query);
      const results = await new AxeBuilder({ page })
        .include(".bx--image-cropper")
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("has no axe violations in Gray 100", async ({ page }) => {
    await open(page, "mode=box&aspect=free");
    await page.evaluate(() => {
      document.documentElement.className = "bx--g100";
    });
    // Axe reads colors mid-fade otherwise.
    await page.evaluate(() =>
      Promise.allSettled(document.getAnimations().map((a) => a.finished)),
    );
    const results = await new AxeBuilder({ page })
      .include(".bx--image-cropper")
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

// Touch needs a context with touch support, which the shared host page
// doesn't have, so these open their own. CDP is Chromium only.
playwrightTest.describe("ImageCropper: touch", () => {
  playwrightTest.skip(
    ({ browserName }) => browserName !== "chromium",
    "CDP touch events are Chromium only",
  );

  playwrightTest(
    "pans with one finger and pinches with two",
    async ({ browser }) => {
      const context = await browser.newContext({
        hasTouch: true,
        viewport: { width: 720, height: 800 },
      });
      const page = await context.newPage();
      await page.goto("/image-cropper.html");
      await expect(page.getByTestId("status")).toHaveText("ready");
      const client = await context.newCDPSession(page);
      const box = await stage(page).boundingBox();
      if (!box) throw new Error("no stage");
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const touch = (
        type: "touchStart" | "touchMove" | "touchEnd",
        points: Array<{ x: number; y: number; id: number }>,
      ) =>
        client.send("Input.dispatchTouchEvent", {
          type,
          touchPoints: type === "touchEnd" ? [] : points,
        });

      // One finger drags the image left, which moves the crop right.
      await touch("touchStart", [{ x: cx, y: cy, id: 1 }]);
      for (let step = 1; step <= 4; step++) {
        // biome-ignore lint/performance/noAwaitInLoops: touch moves are ordered
        await touch("touchMove", [{ x: cx - step * 10.5, y: cy, id: 1 }]);
      }
      await touch("touchEnd", []);
      await expect.poll(async () => (await crop(page)).x).toBe(150);

      // Two fingers spread apart: the frame covers less of the image.
      const before = (await crop(page)).width;
      await touch("touchStart", [
        { x: cx - 40, y: cy, id: 1 },
        { x: cx + 40, y: cy, id: 2 },
      ]);
      for (let step = 1; step <= 6; step++) {
        // biome-ignore lint/performance/noAwaitInLoops: touch moves are ordered
        await touch("touchMove", [
          { x: cx - 40 - step * 15, y: cy, id: 1 },
          { x: cx + 40 + step * 15, y: cy, id: 2 },
        ]);
      }
      await touch("touchEnd", []);
      await expect
        .poll(async () => (await crop(page)).width)
        .toBeLessThan(before / 2);
      const pinched = await crop(page);
      expect(pinched.width).toBe(pinched.height);
      // Spreading about the middle of the frame keeps that point in place.
      expect(pinched.x + pinched.width / 2).toBeCloseTo(150 + before / 2, -1);
      await context.close();
    },
  );
});
