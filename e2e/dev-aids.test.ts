import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// GridOverlay, LayoutInspector and DevToolbar draw over the page, so they
// get their own fixture: on the shared forced-colors page they would cover
// the components that page screenshots.

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

function computed(page: Page, selector: string, pseudo?: string) {
  return page.evaluate(
    ([selector, pseudo]) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`no ${selector}`);
      const s = getComputedStyle(el, pseudo);
      return {
        outline: `${s.outlineStyle} ${s.outlineWidth}`,
        outlineColor: s.outlineColor,
        background: s.backgroundColor,
        backgroundImage: s.backgroundImage,
        borderColor: s.borderTopColor,
        forcedColorAdjust: s.getPropertyValue("forced-color-adjust"),
        direction: s.direction,
      };
    },
    [selector, pseudo ?? null] as const,
  );
}

// Hover the tile and wait for the inspector card to be placed.
async function inspectTile(page: Page) {
  await page.getByTestId("tile").hover();
  await expect(page.locator(".bx--layout-inspector__card")).toBeVisible();
}

test("forced colors: dev aids keep their edges, layers and swatches", async ({
  page,
  browserName,
}) => {
  // WebKit matches the media query but paints author colors unchanged.
  test.skip(browserName === "webkit", "WebKit does not force colors");
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/dev-aids.html");
  await inspectTile(page);
  const canvasText = await systemColor(page, "CanvasText");

  // Surfaces lose the shadow that set them off from the page.
  const surfaces = [
    ".bx--layout-inspector__card",
    ".bx--layout-inspector__summary",
    ".bx--grid-overlay__label",
    ".bx--dev-toolbar",
  ];
  const surfaceStyles = await Promise.all(
    surfaces.map((surface) => computed(page, surface)),
  );
  surfaces.forEach((surface, i) => {
    expect
      .soft(surfaceStyles[i], surface)
      .toMatchObject({ outline: "solid 1px", outlineColor: canvasText });
  });

  // Gradient layers opt out of forcing, so the rows and gutters still draw.
  const layers = [
    [".bx--grid-overlay__baseline"],
    [".bx--grid-overlay--gutters .bx--grid-overlay__col", "::before"],
  ] as const;
  const layerStyles = await Promise.all(
    layers.map(([layer, pseudo]) => computed(page, layer, pseudo)),
  );
  layers.forEach(([layer], i) => {
    expect.soft(layerStyles[i].forcedColorAdjust, layer).toBe("none");
    expect.soft(layerStyles[i].backgroundImage, layer).not.toBe("none");
  });

  // A swatch shows the real color it names, not Canvas.
  const swatch = page.locator(".bx--layout-inspector__swatch").first();
  const [painted, named] = await swatch.evaluate((el) => [
    getComputedStyle(el).backgroundColor,
    (el as HTMLElement).style.background,
  ]);
  expect.soft(painted).not.toBe(await systemColor(page, "Canvas"));
  expect.soft(named).not.toBe("");

  // Margin and padding stay apart in system colors.
  const [margin, padding] = await Promise.all([
    computed(page, ".bx--layout-inspector__margin"),
    computed(page, ".bx--layout-inspector__padding"),
  ]);
  expect.soft(margin.borderColor).toBe(await systemColor(page, "Highlight"));
  expect.soft(padding.borderColor).toBe(await systemColor(page, "GrayText"));
});

test("RTL: dev aid text keeps its order and labels follow the text", async ({
  page,
}) => {
  await page.goto("/dev-aids.html");
  // Let the text marks measure in LTR first, so the flip below has to
  // trigger a fresh measurement.
  await expect(
    page.locator(".bx--grid-overlay__text-delta").first(),
  ).toBeVisible();
  await expect(page.locator(".bx--grid-overlay__text-mark--rtl")).toHaveCount(
    0,
  );
  await page.evaluate(() =>
    document.documentElement.setAttribute("dir", "rtl"),
  );
  await inspectTile(page);

  // Measurements, hex values and token names read left to right.
  const roots = [
    ".bx--layout-inspector",
    ".bx--grid-overlay__label",
    ".bx--grid-overlay__text",
    ".bx--dev-toolbar",
  ];
  const rootStyles = await Promise.all(
    roots.map((root) => computed(page, root)),
  );
  roots.forEach((root, i) => {
    expect.soft(rootStyles[i].direction, root).toBe("ltr");
  });

  // The overlay's grid follows the page: column 1 sits at the right.
  const cols = page.locator(".bx--grid-overlay__col");
  const first = await cols.first().boundingBox();
  const last = await cols.last().boundingBox();
  expect.soft(first?.x).toBeGreaterThan(last?.x ?? Number.POSITIVE_INFINITY);

  // A `dir` change on <html> re-measures the text marks, and an offset
  // label sits at the end of its right-to-left line, on the left.
  await expect(
    page
      .locator(
        ".bx--grid-overlay__text-mark--rtl .bx--grid-overlay__text-delta",
      )
      .first(),
  ).toBeVisible();
  const [label, mark] = await page
    .locator(".bx--grid-overlay__text-mark--rtl")
    .first()
    .evaluate((el) => {
      const delta = el.querySelector(".bx--grid-overlay__text-delta");
      return [
        delta?.getBoundingClientRect().right ?? 0,
        el.getBoundingClientRect().left,
      ];
    });
  expect.soft(label).toBeLessThanOrEqual(mark);

  await page.evaluate(() => document.documentElement.removeAttribute("dir"));
});
