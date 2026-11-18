import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// A 1x1 PNG, served for every `/img/*` request. `/pending/*` never answers, so
// an image stays loading; `/missing/*` is a 404.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

let token = 0;
let requests: string[] = [];
let flakyServed = 0;

test.beforeEach(async ({ page }) => {
  token += 1;
  requests = [];
  flakyServed = 0;
  await page.route("**/img/*", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url.pathname + url.search);
    // Slow enough to measure the box before the image arrives.
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({ body: PIXEL, contentType: "image/png" });
  });
  await page.route("**/pending/*", () => {});
  await page.route("**/missing/*", (route) => route.fulfill({ status: 404 }));
  // Fails once, then serves the image, like a dropped connection.
  await page.route("**/flaky/*", (route) => {
    flakyServed += 1;
    return flakyServed === 1
      ? route.fulfill({ status: 503 })
      : route.fulfill({ body: PIXEL, contentType: "image/png" });
  });
});

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

const open = (page: Page, scene: "visual" | "network") =>
  page.goto(`/image-loader.html?scene=${scene}&token=${token}`);

/** The color of the pixel at CSS offset `[x, y]` in the element's screenshot. */
async function pixel(page: Page, testId: string, x: number, y: number) {
  const png = await page.getByTestId(testId).screenshot();
  return page.evaluate(
    async ([base64, px, py]) => {
      const blob = await (
        await fetch(`data:image/png;base64,${base64}`)
      ).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext(
        "2d",
      ) as OffscreenCanvasRenderingContext2D;
      context.drawImage(bitmap, 0, 0);
      const scale = devicePixelRatio;
      return Array.from(
        context
          .getImageData(Math.round(px * scale), Math.round(py * scale), 1, 1)
          .data.slice(0, 3),
      );
    },
    [png.toString("base64"), x, y] as const,
  );
}

test.describe("ImageLoader", () => {
  test("downloads one file for srcset, not the fallback too", async ({
    page,
  }) => {
    await open(page, "network");
    await expect(page.getByTestId("srcset").locator("img")).toBeVisible();

    // 300px wide at 1x: the 800w candidate. `src` (w400) is the fallback only.
    const own = requests.filter((path) => path.endsWith(`?${token}`));
    expect(own).toEqual([`/img/w800.png?${token}`]);
  });

  test("picks the matching <source> with one download", async ({ page }) => {
    await open(page, "network");
    const img = page.getByTestId("sources").locator("img");
    await expect(img).toBeVisible();

    const own = requests.filter((path) => path.endsWith(`?s${token}`));
    expect(own).toEqual([`/img/w800.png?s${token}`]);
    expect(
      await img.evaluate((element: HTMLImageElement) => element.currentSrc),
    ).toContain("/img/w800.png");
  });

  test("reserves the box from width and height before the image loads", async ({
    page,
  }) => {
    await open(page, "network");
    const box = page.getByTestId("shift");
    const before = await box.boundingBox();
    await expect(box.locator("img")).toBeVisible();
    const after = await box.boundingBox();

    // 300px wide at 400x300: 225px tall from the first frame.
    expect(before?.height).toBeCloseTo(225, 0);
    expect(after?.height).toBeCloseTo(225, 0);
  });

  test("shows an image the page already has without the loading state", async ({
    page,
  }) => {
    await open(page, "network");
    await expect(page.getByTestId("first").locator("img")).toBeVisible();
    await page.evaluate(() => {
      const state = window as unknown as { seen: boolean; stop: boolean };
      state.seen = false;
      state.stop = false;
      const sample = () => {
        if (document.querySelector("[data-testid=again-loading]")) {
          state.seen = true;
        }
        if (!state.stop) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });

    await page.getByRole("button", { name: "Show again" }).click();
    await expect(page.getByTestId("again").locator("img")).toBeVisible();
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );

    const seen = await page.evaluate(() => {
      const state = window as unknown as { seen: boolean; stop: boolean };
      state.stop = true;
      return state.seen;
    });
    expect(seen).toBe(false);
  });

  test("loads again from the error slot", async ({ page }) => {
    await open(page, "network");
    const retry = page.getByTestId("retry");
    await expect(retry.getByRole("button", { name: "Retry" })).toBeVisible();

    await retry.getByRole("button", { name: "Retry" }).click();

    await expect(retry.locator("img")).toBeVisible();
    expect(flakyServed).toBe(2);
  });

  test("crops around the focal point", async ({ page }) => {
    await open(page, "visual");
    await expect(page.getByTestId("focal").locator("img")).toBeVisible();

    const cell = (testId: string) =>
      page
        .getByTestId(testId)
        .locator("img")
        .evaluate((img) => {
          const style = getComputedStyle(img);
          const box = img.getBoundingClientRect();
          return {
            fit: style.objectFit,
            position: style.objectPosition,
            width: Math.round(box.width),
            height: Math.round(box.height),
          };
        });
    // Without fit the image keeps its own shape and leaves the box short.
    expect(await cell("no-fit")).toMatchObject({
      fit: "fill",
      width: 190,
      height: 143,
    });
    expect(await cell("cover")).toMatchObject({
      fit: "cover",
      position: "50% 50%",
      height: 190,
    });
    expect(await cell("focal")).toMatchObject({
      fit: "cover",
      position: "0% 0%",
      height: 190,
    });
    expect(await cell("contain")).toMatchObject({
      fit: "contain",
      height: 190,
    });

    // The marker is in the picture's top-left. A centered crop trims it
    // off at 20px in; a crop on the top-left keeps it.
    const [r, g, b] = await pixel(page, "focal", 20, 3);
    expect([r, g, b]).toEqual([218, 30, 40]);
    const [cr] = await pixel(page, "cover", 20, 3);
    expect(cr).toBeLessThan(150);
  });

  test("fills the reserved box with the placeholder, in every theme", async ({
    page,
  }) => {
    await open(page, "visual");
    const placeholder = page
      .getByTestId("placeholder-skeleton")
      .locator(".bx--image-loader__placeholder");
    await expect(placeholder).toBeVisible();

    const fill = () =>
      placeholder.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
    const white = await fill();
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    const g100 = await fill();

    const luminance = (color: string) => {
      const [r, g, b] = color.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
      return (r + g + b) / 3;
    };
    expect(luminance(white)).toBeGreaterThan(200);
    expect(luminance(g100)).toBeLessThan(80);
    // The box is the ratio's, not zero, while the image is pending.
    const box = await placeholder.boundingBox();
    expect(box?.width).toBe(190);
    expect(box?.height).toBeCloseTo(142.5, 0);
  });

  test("paints a color or a blurred image over the skeleton", async ({
    page,
  }) => {
    await open(page, "visual");
    const layer = (testId: string) =>
      page
        .getByTestId(testId)
        .locator(".bx--image-loader__placeholder")
        .evaluate((element) => {
          const style = getComputedStyle(element, "::before");
          return {
            color: style.backgroundColor,
            image: style.backgroundImage,
            filter: style.filter,
          };
        });

    expect(await layer("placeholder-color")).toMatchObject({
      color: "rgb(127, 95, 163)",
      filter: "none",
    });
    const blurred = await layer("placeholder-blur");
    expect(blurred.image).toContain("data:image/png");
    expect(blurred.filter).toContain("blur(24px)");
  });

  test("keeps the placeholder visible in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, "visual");
    const placeholder = page
      .getByTestId("placeholder-skeleton")
      .locator(".bx--image-loader__placeholder");

    const outline = await placeholder.evaluate((element) => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(outline).toEqual({ style: "solid", width: "1px" });
  });

  test("fades the placeholder out, unless the user prefers reduced motion", async ({
    page,
  }) => {
    await open(page, "visual");
    const placeholder = page
      .getByTestId("placeholder-skeleton")
      .locator(".bx--image-loader__placeholder");
    const duration = () =>
      placeholder.evaluate(
        (element) => getComputedStyle(element).transitionDuration,
      );

    expect(await duration()).toBe("0.11s");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await duration()).toBe("0s");
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await open(page, "visual");
    await expect(page.getByTestId("focal").locator("img")).toBeVisible();
    await expect(
      page.getByTestId("error").getByRole("button", { name: "Retry" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
