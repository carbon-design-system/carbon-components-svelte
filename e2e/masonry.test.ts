import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// Masonry puts each item in the shortest column and leaves the DOM alone, so
// the tab order is the source order. Placing each item in the shortest column
// in turn means no item sits above the one before it: reading the items by
// top, then by inline start, gives the source order back. These tests press
// Tab and compare where focus lands with the geometry, for both ways of
// packing the items: the script, and `display: grid-lanes` where the browser
// has it.

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Each item's box, in source order, from the top of the container. */
function boxes(page: Page, testId: string) {
  return page.evaluate((id) => {
    const root = document.querySelector(`[data-testid=${id}]`);
    if (!root) throw new Error(`no ${id}`);
    const origin = root.getBoundingClientRect();
    return [...root.children]
      .filter((el) => getComputedStyle(el).display !== "none")
      .map((el) => {
        const { left, right, top, bottom } = el.getBoundingClientRect();
        return {
          left: left - origin.left,
          right: right - origin.left,
          top: top - origin.top,
          bottom: bottom - origin.top,
        };
      });
  }, testId);
}

/** The box of the item that holds focus, and its label, after each Tab. */
async function tabThrough(page: Page, testId: string, count: number) {
  await page.locator(`[data-testid=${testId}] button`).first().focus();
  const visited: { text: string; box: Box }[] = [];
  for (let i = 0; i < count; i++) {
    visited.push(
      await page.evaluate((id) => {
        const root = document.querySelector(`[data-testid=${id}]`);
        const active = document.activeElement;
        const item = [...(root?.children ?? [])].find((el) =>
          el.contains(active),
        );
        if (!root || !item) throw new Error("focus left the masonry");
        const origin = root.getBoundingClientRect();
        const { left, right, top, bottom } = item.getBoundingClientRect();
        return {
          text: active?.textContent?.trim() ?? "",
          box: {
            left: left - origin.left,
            right: right - origin.left,
            top: top - origin.top,
            bottom: bottom - origin.top,
          },
        };
      }, testId),
    );
    if (i < count - 1) await page.keyboard.press("Tab");
  }
  return visited;
}

const EPSILON = 0.02;

/** Each box comes after the one before it: lower, or level and further along. */
function expectReadingOrder(items: Box[], rtl = false) {
  const start = (box: Box) => (rtl ? -box.right : box.left);
  for (let i = 1; i < items.length; i++) {
    const a = items[i - 1];
    const b = items[i];
    expect(
      b.top > a.top + EPSILON ||
        (Math.abs(b.top - a.top) <= EPSILON && start(b) > start(a) + 1),
      `item ${i + 1} (${Math.round(b.left)}, ${Math.round(b.top)}) after item ${i} (${Math.round(a.left)}, ${Math.round(a.top)})`,
    ).toBe(true);
  }
}

/** No two boxes cover the same area. */
function expectNoOverlap(items: Box[]) {
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      const across = a.left < b.right - 0.5 && b.left < a.right - 0.5;
      const down = a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      expect(across && down, `items ${i + 1} and ${j + 1} overlap`).toBe(false);
    }
}

const columns = (items: Box[]) =>
  new Set(items.map((box) => Math.round(box.left))).size;

/** Packed rather than in rows: more distinct tops than a grid would have. */
function expectPacked(items: Box[]) {
  const rows = Math.ceil(items.length / columns(items));
  expect(new Set(items.map((box) => Math.round(box.top))).size).toBeGreaterThan(
    rows,
  );
}

const settle = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
      ),
  );

test.beforeEach(async ({ page }) => {
  await page.goto("/masonry.html");
  await expect(page.getByTestId("js")).toHaveClass(/bx--masonry--placed/);
});

for (const testId of ["auto", "js", "fixed"]) {
  test(`${testId}: Tab follows the visual order`, async ({ page }) => {
    const items = await boxes(page, testId);
    expect(columns(items)).toBeGreaterThan(1);
    expectPacked(items);
    expectReadingOrder(items);

    const visited = await tabThrough(page, testId, items.length);
    expect(visited.map((v) => v.text)).toEqual(
      items.map((_, i) => `Item ${i + 1}`),
    );
    expectReadingOrder(visited.map((v) => v.box));
  });

  test(`${testId}: Tab follows the visual order in RTL`, async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await settle(page);
    const items = await boxes(page, testId);
    expectPacked(items);
    // The first item sits against the right edge.
    expect(items[0].right).toBeCloseTo(
      Math.max(...items.map((box) => box.right)),
      0,
    );
    expectReadingOrder(items, true);
    const visited = await tabThrough(page, testId, items.length);
    expectReadingOrder(
      visited.map((v) => v.box),
      true,
    );
  });
}

test("the fixed number of columns is the number of columns", async ({
  page,
}) => {
  expect(columns(await boxes(page, "fixed"))).toBe(3);
});

test("the script packs the items as display: grid-lanes does", async ({
  page,
  browserName,
}) => {
  const lanes = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector("[data-testid=auto]")!)
        .display === "grid-lanes",
  );
  expect(lanes).toBe(browserName === "webkit");
  const native = await boxes(page, "auto");
  const script = await boxes(page, "js");
  expect(script).toHaveLength(native.length);
  script.forEach((box, i) => {
    for (const key of ["left", "right", "top", "bottom"] as const)
      expect(box[key], `item ${i + 1} ${key}`).toBeCloseTo(native[i][key], 0);
  });
});

test("the columns follow the width of the container", async ({ page }) => {
  const widths: [number, number][] = [
    [768, 4],
    [400, 2],
    [180, 1],
    [768, 4],
  ];
  for (const [width, count] of widths) {
    await page.evaluate((w) => {
      for (const id of ["auto", "js"]) {
        const wrap = document.querySelector(`[data-testid=${id}-wrap]`);
        if (wrap instanceof HTMLElement) wrap.style.inlineSize = `${w}px`;
      }
    }, width);
    await expect.poll(async () => columns(await boxes(page, "js"))).toBe(count);
    const items = await boxes(page, "js");
    expectReadingOrder(items);
    expectNoOverlap(items);
    const root = await page.getByTestId("js").boundingBox();
    expect(root?.height).toBeCloseTo(
      Math.max(...items.map((box) => box.bottom)),
      0,
    );
    expectReadingOrder(await boxes(page, "auto"));
  }
});

test("an item added at the front, or taken out of the layout, repacks the rest", async ({
  page,
}) => {
  const before = await boxes(page, "dynamic");
  expect(before).toHaveLength(8);
  expectReadingOrder(before);

  await page.getByTestId("prepend").click();
  await expect.poll(async () => (await boxes(page, "dynamic")).length).toBe(9);
  await settle(page);
  let items = await boxes(page, "dynamic");
  expectReadingOrder(items);
  expectNoOverlap(items);
  expect(items[0]).toMatchObject({ left: 0, top: 0 });

  await page.getByTestId("hide").click();
  await expect.poll(async () => (await boxes(page, "dynamic")).length).toBe(8);
  await settle(page);
  items = await boxes(page, "dynamic");
  expectReadingOrder(items);
  expectNoOverlap(items);

  await page.getByTestId("hide").click();
  await expect.poll(async () => (await boxes(page, "dynamic")).length).toBe(9);
  await settle(page);
  items = await boxes(page, "dynamic");
  expectReadingOrder(items);
  expectNoOverlap(items);
});

test("an item whose style attribute is set again keeps its place", async ({
  page,
}) => {
  const before = await boxes(page, "dynamic");
  await page.getByTestId("tint").click();
  await settle(page);
  expect(await boxes(page, "dynamic")).toEqual(before);
});

test("images that arrive late move the items below them, and nothing overlaps", async ({
  page,
}) => {
  const flat = await boxes(page, "late");
  await page.getByTestId("load-images").click();
  await expect(page.getByTestId("late")).toHaveAttribute("data-loaded", "true");
  await expect
    .poll(async () => {
      const items = await boxes(page, "late");
      return Math.max(...items.map((box) => box.bottom));
    })
    .toBeGreaterThan(Math.max(...flat.map((box) => box.bottom)) + 100);
  // Let the last image's repack land.
  await settle(page);
  const items = await boxes(page, "late");
  expectReadingOrder(items);
  expectNoOverlap(items);
  const root = await page.getByTestId("late").boundingBox();
  expect(root?.height).toBeCloseTo(
    Math.max(...items.map((box) => box.bottom)),
    0,
  );
});

test("forced colors leave the layout alone", async ({ page, browserName }) => {
  test.skip(browserName === "webkit", "WebKit does not force colors");
  const before = await boxes(page, "js");
  await page.emulateMedia({ forcedColors: "active" });
  await settle(page);
  const after = await boxes(page, "js");
  after.forEach((box, i) => {
    for (const key of ["left", "right", "top", "bottom"] as const)
      expect(box[key], `item ${i + 1} ${key}`).toBeCloseTo(before[i][key], 0);
  });
});
