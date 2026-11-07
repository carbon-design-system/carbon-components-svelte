import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import type {
  BrowserContext,
  CDPSession,
  Locator,
  Page,
} from "@playwright/test";
import { createServer } from "vite";
import { expect, test } from "./helpers/host";

// ImageCompare lays two sides in one frame behind a divider. The clip, the
// divider's place and the pointer math are all geometry, so these tests read
// what is under the pointer and where the boxes are, not just attributes.

const stage = (page: Page, testId: string) =>
  page.getByTestId(testId).locator(".bx--image-compare__stage");

const divider = (page: Page, testId: string) =>
  page.getByTestId(testId).getByRole("slider");

/** The alt text or text of what is painted at a share of the stage's box. */
async function paintedAt(page: Page, testId: string, x: number, y = 0.5) {
  await stage(page, testId).scrollIntoViewIfNeeded();
  return stage(page, testId).evaluate(
    (node, [x, y]) => {
      const rect = node.getBoundingClientRect();
      const hit = document.elementFromPoint(
        rect.left + rect.width * x,
        rect.top + rect.height * y,
      );
      return hit instanceof HTMLImageElement
        ? hit.alt
        : (hit?.textContent?.trim() ?? null);
    },
    [x, y],
  );
}

async function pointAt(locator: Locator, x: number, y = 0.5) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("not rendered");
  return { x: box.x + box.width * x, y: box.y + box.height * y };
}

async function pressAndDrag(
  page: Page,
  locator: Locator,
  from: number,
  to: number,
) {
  const start = await pointAt(locator, from);
  const end = await pointAt(locator, to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move((start.x + end.x) / 2, end.y, { steps: 4 });
  await page.mouse.move(end.x, end.y, { steps: 4 });
  await page.mouse.up();
}

const valueDisplay = (page: Page) => page.getByTestId("value-display");

/** A value a pointer set, which can land a rounding step off in some engines. */
const expectValueNear = (page: Page, expected: number) =>
  expect
    .poll(async () => Number(await valueDisplay(page).textContent()))
    .toBeCloseTo(expected, 0);

test.beforeEach(async ({ page }) => {
  await page.goto("/image-compare.html");
  await expect(divider(page, "slider")).toBeVisible();
});

test.describe("ImageCompare a11y", () => {
  test("has no detectable accessibility violations in any mode", async ({
    page,
  }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    await divider(page, "slider").focus();
    await page.keyboard.press("End");
    await page.getByRole("tab", { name: "Current" }).click();
    // Axe reads colors, so let the fade finish.
    await expect(
      page.getByTestId("toggle").locator(".bx--image-compare__layer--before"),
    ).toBeHidden();

    const changed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(changed.violations).toEqual([]);
  });

  test("names the divider and says what it shows", async ({ page }) => {
    const slider = divider(page, "slider");
    await expect(slider).toHaveAttribute(
      "aria-valuetext",
      "Showing 50% of Before",
    );
    await expect(
      page.getByRole("group", { name: "Denoised photo" }),
    ).toBeVisible();
    await expect(
      page.getByRole("slider", { name: "Comparison position" }).first(),
    ).toBeVisible();
  });
});

test.describe("ImageCompare keyboard", () => {
  test("reaches the divider with Tab and moves it with the keys", async ({
    page,
  }) => {
    await page.keyboard.press("Tab");
    const slider = divider(page, "slider");
    await expect(slider).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(valueDisplay(page)).toHaveText("51");
    await page.keyboard.press("Shift+ArrowLeft");
    await expect(valueDisplay(page)).toHaveText("41");
    await page.keyboard.press("End");
    await expect(valueDisplay(page)).toHaveText("100");
    await expect(slider).toHaveAttribute(
      "aria-valuetext",
      "Showing 100% of Before",
    );
    await page.keyboard.press("Home");
    await expect(valueDisplay(page)).toHaveText("0");

    // The key moved what is painted, not only the number.
    expect(await paintedAt(page, "slider", 0.1)).toBe(
      "Denoised photo with vivid color",
    );
    await page.keyboard.press("End");
    expect(await paintedAt(page, "slider", 0.9)).toBe(
      "Noisy, flat photo of mountains at dusk",
    );

    await page.keyboard.press("Tab");
    await expect(divider(page, "vertical")).toBeFocused();
  });

  test("draws a focus ring on the handle", async ({ page }) => {
    await page.keyboard.press("Tab");
    const ring = await page
      .getByTestId("slider")
      .locator(".bx--image-compare__handle")
      .evaluate((node) => {
        const style = getComputedStyle(node);
        return { style: style.outlineStyle, width: style.outlineWidth };
      });
    expect(ring).toEqual({ style: "solid", width: "2px" });
  });

  test("moves a vertical divider with Up and Down", async ({ page }) => {
    const slider = divider(page, "vertical");
    await slider.focus();
    await page.keyboard.press("ArrowDown");
    await expect(slider).toHaveAttribute("aria-valuenow", "51");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect(slider).toHaveAttribute("aria-valuenow", "49");
  });

  test("switches the toggle with the arrow keys", async ({ page }) => {
    await page.getByRole("tab", { name: "Baseline" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("selected-display")).toHaveText("after");
    await expect
      .poll(() => paintedAt(page, "toggle", 0.5, 0.9))
      .toBe("Current screenshot");
  });
});

test.describe("ImageCompare pointer", () => {
  test("jumps to a click and follows a drag without selecting anything", async ({
    page,
  }) => {
    const target = stage(page, "slider");
    const click = await pointAt(target, 0.25);
    await page.mouse.click(click.x, click.y);
    await expectValueNear(page, 25);
    await expect(divider(page, "slider")).toBeFocused();

    await pressAndDrag(page, target, 0.25, 0.8);
    await expectValueNear(page, 80);
    expect(await paintedAt(page, "slider", 0.6)).toBe(
      "Noisy, flat photo of mountains at dusk",
    );
    expect(await paintedAt(page, "slider", 0.9)).toBe(
      "Denoised photo with vivid color",
    );
    expect(await page.evaluate(() => getSelection()?.toString())).toBe("");
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });

  test("keeps following a drag that leaves the frame", async ({ page }) => {
    const target = stage(page, "slider");
    const start = await pointAt(target, 0.5);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 700, start.y + 300, { steps: 4 });
    await expect(valueDisplay(page)).toHaveText("100");
    await page.mouse.move(start.x - 900, start.y, { steps: 4 });
    await expect(valueDisplay(page)).toHaveText("0");
    await page.mouse.up();
  });

  test("a vertical divider measures from the top", async ({ page }) => {
    const target = stage(page, "vertical");
    await target.scrollIntoViewIfNeeded();
    const click = await pointAt(target, 0.5, 0.25);
    await page.mouse.click(click.x, click.y);
    await expect
      .poll(async () =>
        Number(await divider(page, "vertical").getAttribute("aria-valuenow")),
      )
      .toBeCloseTo(25, 0);
    expect(await paintedAt(page, "vertical", 0.5, 0.1)).toBe(
      "Old settings page",
    );
    expect(await paintedAt(page, "vertical", 0.5, 0.6)).toBe(
      "Redesigned settings page",
    );
  });

  test("a drag does not lay out the page", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "LayoutCount is a Chromium metric");
    const client = await page.context().newCDPSession(page);
    await client.send("Performance.enable");
    const layouts = async () =>
      (await client.send("Performance.getMetrics")).metrics.find(
        (metric) => metric.name === "LayoutCount",
      )?.value ?? Number.NaN;
    // The slider with nothing bound beside it, so nothing else re-lays out.
    const target = stage(page, "quiet");
    await target.scrollIntoViewIfNeeded();
    const start = await pointAt(target, 0.2);
    const end = await pointAt(target, 0.7);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 5, start.y);
    await expect(divider(page, "quiet")).not.toHaveAttribute(
      "aria-valuenow",
      "50",
    );
    const before = await layouts();
    await page.mouse.move(end.x, end.y, { steps: 30 });
    await expect(divider(page, "quiet")).toHaveAttribute("aria-valuenow", "70");
    const after = await layouts();
    await page.mouse.up();
    expect(after - before).toBe(0);
  });

  test("fires change for each move and not for a no-op", async ({ page }) => {
    const slider = divider(page, "slider");
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("End");
    await page.keyboard.press("End");
    await expect(page.getByTestId("change-count")).toHaveText("3");
  });
});

test.describe("ImageCompare touch", () => {
  // A touch context of its own: the shared page has no touch screen.
  let context: BrowserContext;
  let page: Page;
  test.beforeEach(async ({ browser, baseURL, browserName }) => {
    test.skip(browserName === "firefox", "Firefox has no touch emulation");
    context = await browser.newContext({
      baseURL,
      hasTouch: true,
      viewport: { width: 800, height: 600 },
    });
    page = await context.newPage();
    await page.goto("/image-compare.html");
    await expect(divider(page, "slider")).toBeVisible();
  });
  test.afterEach(async () => {
    await context?.close();
  });

  const touch = (client: CDPSession, type: string, x: number, y: number) =>
    client.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x, y }],
    });

  test("a tap jumps the divider", async () => {
    const point = await pointAt(stage(page, "slider"), 0.3);
    await page.touchscreen.tap(point.x, point.y);
    await expectValueNear(page, 30);
  });

  test("hands the other axis to the browser through touch-action", async () => {
    const action = (testId: string) =>
      stage(page, testId).evaluate(
        (node) => getComputedStyle(node).touchAction,
      );
    expect(await action("slider")).toBe("pan-y");
    expect(await action("vertical")).toBe("pan-x");
  });

  test("drags with a swipe along the axis and leaves the page where it is", async ({
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Touch swipes need CDP");
    const client = await context.newCDPSession(page);
    const from = await pointAt(stage(page, "slider"), 0.5);

    await touch(client, "touchStart", from.x, from.y);
    for (let step = 1; step <= 8; step++) {
      await touch(client, "touchMove", from.x + step * 20, from.y + step);
    }
    await touch(client, "touchEnd", 0, 0);

    expect(Number(await valueDisplay(page).textContent())).toBeGreaterThan(75);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });

  test("a vertical touch pan that starts on the stage scrolls the page and never moves the divider", async ({
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Touch swipes need CDP");
    const client = await context.newCDPSession(page);
    const from = await pointAt(stage(page, "slider"), 0.8);

    await touch(client, "touchStart", from.x, from.y);
    for (let step = 1; step <= 10; step++) {
      await touch(client, "touchMove", from.x - step, from.y - step * 25);
    }
    await touch(client, "touchEnd", 0, 0);

    await expect(valueDisplay(page)).toHaveText("50");
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(50);
  });
});

test.describe("ImageCompare RTL", () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
  });

  test("Before sits on the right and its label with it", async ({ page }) => {
    expect(await paintedAt(page, "slider", 0.9)).toBe(
      "Noisy, flat photo of mountains at dusk",
    );
    expect(await paintedAt(page, "slider", 0.1)).toBe(
      "Denoised photo with vivid color",
    );
    const root = page.getByTestId("slider");
    const before = await root
      .getByText("Before", { exact: true })
      .boundingBox();
    const after = await root.getByText("After", { exact: true }).boundingBox();
    assert(before && after);
    expect(before.x).toBeGreaterThan(after.x);
  });

  test("measures a click from the right and moves the divider with it", async ({
    page,
  }) => {
    const target = stage(page, "slider");
    const click = await pointAt(target, 0.25);
    await page.mouse.click(click.x, click.y);
    await expectValueNear(page, 75);

    const box = await target.boundingBox();
    const handle = await page
      .getByTestId("slider")
      .locator(".bx--image-compare__handle")
      .boundingBox();
    assert(box && handle);
    expect(handle.x + handle.width / 2).toBeCloseTo(
      box.x + box.width * 0.25,
      0,
    );
    // 75% of the frame, counted from the right, still shows Before.
    expect(await paintedAt(page, "slider", 0.5)).toBe(
      "Noisy, flat photo of mountains at dusk",
    );
    expect(await paintedAt(page, "slider", 0.1)).toBe(
      "Denoised photo with vivid color",
    );
  });

  test("ArrowLeft grows Before", async ({ page }) => {
    await divider(page, "slider").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(valueDisplay(page)).toHaveText("51");
  });
});

test.describe("ImageCompare frame", () => {
  test("fits images of different shapes into the same frame", async ({
    page,
  }) => {
    const boxes = await page.getByTestId("mismatch").evaluate((root) => {
      const frame = root.querySelector(".bx--image-compare__stage");
      const rect = (el: Element | null) => {
        const r = el?.getBoundingClientRect();
        return r && [r.x, r.y, r.width, r.height].map((n) => Math.round(n));
      };
      const [first, second] = [...root.querySelectorAll("img")];
      return {
        frame: rect(frame),
        first: rect(first),
        second: rect(second),
        naturals: [first, second].map((img) => [
          img.naturalWidth,
          img.naturalHeight,
        ]),
        fit: [first, second].map((img) => getComputedStyle(img).objectFit),
      };
    });
    expect(boxes.first).toEqual(boxes.frame);
    expect(boxes.second).toEqual(boxes.frame);
    expect(boxes.naturals[0]).not.toEqual(boxes.naturals[1]);
    expect(boxes.fit).toEqual(["cover", "cover"]);
  });

  test("slot content fills the same frame", async ({ page }) => {
    expect(await paintedAt(page, "slots", 0.1)).toBe("Q1 revenue");
    expect(await paintedAt(page, "slots", 0.9)).toBe("Q2 revenue");
  });

  test("side by side gives each side the same frame", async ({ page }) => {
    const root = page.getByTestId("side-by-side");
    const frames = await root
      .locator(".bx--aspect-ratio")
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getBoundingClientRect().width),
      );
    expect(frames).toHaveLength(2);
    expect(frames[0]).toBeCloseTo(frames[1], 0);
    await expect(root.getByRole("img")).toHaveCount(2);
  });

  test("toggle crossfades, and not under reduced motion", async ({ page }) => {
    const layer = page
      .getByTestId("toggle")
      .locator(".bx--image-compare__layer--before");
    const duration = () =>
      layer.evaluate((node) => getComputedStyle(node).transitionDuration);
    expect(await duration()).not.toBe("0s");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await duration()).toBe("0s");
  });
});

test.describe("ImageCompare forced colors", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
  });

  test("draws the line and handle from system colors over the image", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit cannot emulate forced colors");
    const root = page.getByTestId("mismatch");
    const colors = await page.evaluate(() => {
      const probe = document.createElement("div");
      document.body.append(probe);
      const read = (name: string) => {
        probe.style.backgroundColor = name;
        return getComputedStyle(probe).backgroundColor;
      };
      const result = { canvas: read("Canvas"), text: read("CanvasText") };
      probe.remove();
      return result;
    });
    const style = await root.evaluate((node) => {
      const handle = getComputedStyle(
        node.querySelector(".bx--image-compare__handle") as Element,
      );
      const line = getComputedStyle(
        node.querySelector(".bx--image-compare__divider") as Element,
        "::before",
      );
      return {
        handleBorder: handle.borderTopColor,
        handleFill: handle.backgroundColor,
        lineEdge: line.borderLeftColor,
        lineFill: line.backgroundColor,
        label: getComputedStyle(
          node.querySelector(".bx--image-compare__label") as Element,
        ).borderTopColor,
      };
    });
    expect(style).toEqual({
      handleBorder: colors.text,
      handleFill: colors.canvas,
      lineEdge: colors.text,
      lineFill: colors.canvas,
      label: colors.text,
    });

    // The line shows over the image: its column has both system colors.
    await root.scrollIntoViewIfNeeded();
    const handle = await root
      .locator(".bx--image-compare__handle")
      .boundingBox();
    const box = await stage(page, "mismatch").boundingBox();
    assert(handle && box);
    const png = await page.screenshot({
      clip: {
        x: Math.round(handle.x + handle.width / 2) - 3,
        y: Math.round(box.y + 6),
        width: 6,
        height: 8,
      },
    });
    const seen = await page.evaluate(
      async ([png, canvas, text]) => {
        const img = new Image();
        img.src = `data:image/png;base64,${png}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d");
        if (!ctx) throw new Error("no 2d context");
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, img.width, img.height);
        const keys = new Set<string>();
        for (let i = 0; i < data.length; i += 4) {
          keys.add(`rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`);
        }
        return [keys.has(canvas), keys.has(text)];
      },
      [png.toString("base64"), colors.canvas, colors.text] as const,
    );
    expect(seen).toEqual([true, true]);
  });
});

test.describe("ImageCompare server render", () => {
  /** Where the handle sits and which side shows at points along the stage. */
  function frame(page: Page, testId: string) {
    return page.evaluate((testId) => {
      const root = document.querySelector(`[data-testid="${testId}"]`);
      const stage = root?.querySelector(".bx--image-compare__stage");
      const handle = root?.querySelector(".bx--image-compare__handle");
      if (!stage || !handle) throw new Error("not rendered");
      stage.scrollIntoView({ block: "center" });
      const box = stage.getBoundingClientRect();
      const at = (x: number, y: number) =>
        document
          .elementFromPoint(box.left + box.width * x, box.top + box.height * y)
          ?.textContent?.trim();
      const rect = handle.getBoundingClientRect();
      const percent = (n: number) => Math.round(n * 1000) / 10;
      return {
        handle: [
          percent((rect.left + rect.width / 2 - box.left) / box.width),
          percent((rect.top + rect.height / 2 - box.top) / box.height),
        ],
        points: [at(0.1, 0.1), at(0.5, 0.2), at(0.9, 0.9), at(0.5, 0.9)],
      };
    }, testId);
  }

  test("places the divider and clips Before before the script runs", async ({
    page,
    browser,
    baseURL,
  }) => {
    const vite = await createServer({
      configFile: "e2e/vite.config.ts",
      server: { middlewareMode: true, hmr: false },
      appType: "custom",
      logLevel: "silent",
    });
    let body: string;
    try {
      const { render } = await vite.ssrLoadModule("svelte/server");
      const { default: Fixture } = await vite.ssrLoadModule(
        "/ImageCompareServerFixture.svelte",
      );
      ({ body } = render(Fixture));
    } finally {
      await vite.close();
    }

    await page.goto("/image-compare-server.html");
    await expect(page.getByTestId("ltr").getByRole("slider")).toBeVisible();
    const styles = await page.evaluate(() =>
      [...document.querySelectorAll("style, link[rel=stylesheet]")]
        .map((node) => node.outerHTML)
        .join(""),
    );

    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
    });
    const serverPage = await context.newPage();
    await serverPage.goto("/image-compare-server.html");
    await serverPage.setContent(`<head>${styles}</head><body>${body}</body>`);

    for (const testId of ["ltr", "rtl", "vertical"]) {
      expect
        .soft(await frame(serverPage, testId), testId)
        .toEqual(await frame(page, testId));
    }
    // Before takes the first 30% from its edge: the left in LTR, the right
    // in RTL, the top when vertical.
    const ltr = await frame(serverPage, "ltr");
    expect(ltr.handle[0]).toBeCloseTo(30, 0);
    expect(ltr.points[0]).toContain("Before side");
    expect(ltr.points[2]).toContain("After side");
    const rtl = await frame(serverPage, "rtl");
    expect(rtl.handle[0]).toBeCloseTo(70, 0);
    expect(rtl.points[2]).toContain("Before side");
    expect(rtl.points[0]).toContain("After side");
    const vertical = await frame(serverPage, "vertical");
    expect(vertical.handle[1]).toBeCloseTo(30, 0);
    expect(vertical.points[1]).toContain("Before side");
    expect(vertical.points[3]).toContain("After side");
    await context.close();
  });
});
