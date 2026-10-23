import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

// Forced colors repaint HTML with a few system colors but leave an SVG's
// class-set fill and stroke alone, so a label in the theme's gray vanishes
// on a contrast theme's canvas while a swatch, a background, turns to
// Canvas and disappears. These read what a user in that mode sees.

function systemColor(page: Page, name: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = name;
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, name);
}

test.describe("viz forced colors", () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    test.setTimeout(120_000);
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/viz-forced-colors.html");
    await expect(page.locator("figure")).toHaveCount(8);
  });

  test("SVG text takes the canvas text color", async ({ page }) => {
    const canvasText = await systemColor(page, "CanvasText");
    const fills = await page.evaluate(() =>
      [...document.querySelectorAll("figure")].flatMap((figure) => {
        const title = figure.getAttribute("aria-label") ?? "";
        const seen = new Map<string, string>();
        for (const text of figure.querySelectorAll("svg text")) {
          // A label that names a series in its color is a swatch: it keeps it.
          if ((text as SVGElement).style.getPropertyValue("--bx-viz-color"))
            continue;
          const fill = getComputedStyle(text).fill;
          if (!seen.has(fill)) seen.set(fill, text.textContent ?? "");
        }
        return [...seen].map(([fill, sample]) => ({ title, fill, sample }));
      }),
    );
    expect(fills.length).toBeGreaterThan(0);
    for (const f of fills) {
      expect.soft(f.fill, `${f.title}: "${f.sample}"`).toBe(canvasText);
    }
  });

  test("swatches keep their series color", async ({ page }) => {
    const canvas = await systemColor(page, "Canvas");
    const canvasText = await systemColor(page, "CanvasText");
    const swatches = await page.evaluate(() =>
      [...document.querySelectorAll(".bx--viz-legend__swatch")].map((el) => ({
        text: el.parentElement?.textContent?.trim(),
        background: getComputedStyle(el).backgroundColor,
      })),
    );
    expect(swatches.length).toBeGreaterThan(0);
    for (const s of swatches) {
      expect.soft(s.background, s.text).not.toBe(canvas);
      expect.soft(s.background, s.text).not.toBe(canvasText);
    }
    const distinct = new Set(
      swatches
        .filter((s) => /EMEA|APAC|AMER/.test(s.text ?? ""))
        .map((s) => s.background),
    );
    expect(distinct.size).toBe(3);
  });

  test("bars keep their series color and gain an outline", async ({ page }) => {
    const canvasText = await systemColor(page, "CanvasText");
    const bars = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          "figure[aria-label='Bar'] .bx--viz-bars__bar",
        ),
      ].map((el) => {
        const s = getComputedStyle(el);
        return { fill: s.fill, stroke: s.stroke, width: s.strokeWidth };
      }),
    );
    expect(bars.length).toBeGreaterThan(0);
    expect(new Set(bars.map((b) => b.fill)).size).toBe(3);
    for (const b of bars) {
      expect.soft(b.stroke).toBe(canvasText);
      expect.soft(b.width).toBe("1px");
    }
  });

  test("the loading state and the tooltip keep an edge", async ({ page }) => {
    const skeleton = page.locator(".bx--viz-chart__skeleton").first();
    await expect(skeleton).toBeVisible();
    const outline = await skeleton.evaluate(
      (el) => getComputedStyle(el).outlineStyle,
    );
    expect(outline).not.toBe("none");

    const line = page.locator("figure[aria-label='Line'] .bx--viz-chart__svg");
    const box = await line.boundingBox();
    if (!box) throw new Error("no line plot");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const tooltip = page.locator(
      "figure[aria-label='Line'] .bx--viz-chart-tooltip",
    );
    await expect(tooltip).toBeVisible();
    const border = await tooltip.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.borderTopStyle} ${s.borderTopWidth}`;
    });
    expect(border).toBe("solid 1px");
  });
});

test("print hides the pointer-driven parts and keeps a chart whole", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/viz-forced-colors.html");
  await expect(page.locator("figure")).toHaveCount(8);
  const line = page.locator("figure[aria-label='Line'] .bx--viz-chart__svg");
  const box = await line.boundingBox();
  if (!box) throw new Error("no line plot");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const tooltip = page.locator(
    "figure[aria-label='Line'] .bx--viz-chart-tooltip",
  );
  await expect(tooltip).toBeVisible();

  await page.emulateMedia({ media: "print" });
  await expect(tooltip).toBeHidden();
  const breakInside = await page
    .locator("figure[aria-label='Line']")
    .evaluate((el) => getComputedStyle(el).breakInside);
  expect(breakInside).toBe("avoid");
});
