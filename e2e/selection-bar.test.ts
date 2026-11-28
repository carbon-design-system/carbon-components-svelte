import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";
import {
  expectAligned,
  expectNoPageOverflow,
  expectTextFits,
} from "./helpers/layout";

/** The box of an element's first run of text. */
function textBox(locator: Locator) {
  return locator.evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node && !node.textContent?.trim()) node = walker.nextNode();
    const range = document.createRange();
    range.selectNodeContents(node ?? el);
    const { x, width } = range.getBoundingClientRect();
    return { x, width };
  });
}

test.describe("SelectionBar", () => {
  test("lines up with DataTable's batch actions", async ({ page }) => {
    await page.goto("/selection-bar.html");
    const bar = page.getByRole("region", { name: "2 selected" });
    const row = bar.locator(".bx--selection-bar__bar");
    const style = await row.evaluate((el) => {
      const s = getComputedStyle(el);
      return { height: el.getBoundingClientRect().height, color: s.color };
    });
    expect(style.height).toBe(48);
    // The count's text and the first tag start at one inline edge.
    const [count, tag] = await Promise.all([
      textBox(bar.locator(".bx--selection-bar__summary")),
      bar.locator(".bx--tag").first().boundingBox(),
    ]);
    expect(count.x).toBe(tag!.x);
    await expectAligned(
      [bar.getByRole("button", { name: "Clear selection" }), row],
      { edge: "inline-end", ink: false },
    );
  });

  test("hides when cleared, and returns focus to the last checkbox", async ({
    page,
  }) => {
    await page.goto("/selection-bar.html");
    const first = page.getByRole("checkbox", { name: "API gateway" });
    await first.focus();
    // Shift+Tab goes back up the page, past the two tags, to the button.
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(
      page.getByRole("button", { name: "Clear selection" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("bar")).toHaveCount(0);
    await expect(page.getByTestId("clears")).toHaveText("1");
    await expect(first).toBeFocused();
  });

  test("updates its count and items as the selection changes", async ({
    page,
  }) => {
    await page.goto("/selection-bar.html");
    await page.getByText("Search index").click();
    await expect(
      page.getByRole("region", { name: "3 selected" }),
    ).toContainText("Search index");
    await page
      .getByRole("button", { name: "Clear filter API gateway" })
      .click();
    await expect(
      page.getByRole("region", { name: "2 selected" }),
    ).toBeVisible();
  });

  test("hides the items row while the slot renders nothing", async ({
    page,
  }) => {
    await page.goto("/selection-bar.html?empty-items");
    const bar = page.getByTestId("bar");
    await expect(bar.locator(".bx--selection-bar__items")).toBeHidden();
    const [box, row] = await Promise.all([
      bar.boundingBox(),
      bar.locator(".bx--selection-bar__bar").boundingBox(),
    ]);
    expect(box!.height).toBe(row!.height);
  });

  test("pins to the bottom of the viewport", async ({ page }) => {
    await page.goto("/selection-bar.html?pinned");
    const box = await page.getByTestId("bar").boundingBox();
    const viewport = page.viewportSize();
    expect(box && viewport).toBeTruthy();
    if (!box || !viewport) return;
    expect(box.y + box.height).toBe(viewport.height);
    expect(box.x).toBe(0);
    expect(box.width).toBe(viewport.width);
  });

  for (const [width, dir, placement] of [
    [320, "ltr", "content"],
    [420, "ltr", "content"],
    [420, "rtl", "content"],
    [420, "ltr", "pinned"],
  ] as const) {
    test(`keeps the clear button on the count's row when the actions wrap, at ${width}px ${dir} ${placement}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 640 });
      await page.goto(
        `/selection-bar.html?${placement === "pinned" ? "pinned" : ""}`,
      );
      await page.evaluate((dir) => {
        document.documentElement.dir = dir;
      }, dir);
      const bar = page.getByTestId("bar");
      await expectNoPageOverflow(page);
      expect(await expectTextFits(bar)).toBeGreaterThan(0);
      const [frame, summary, clear, download, remove] = await Promise.all([
        bar.locator(".bx--selection-bar__bar").boundingBox(),
        bar.locator(".bx--selection-bar__summary").boundingBox(),
        bar.getByRole("button", { name: "Clear selection" }).boundingBox(),
        bar.getByRole("button", { name: "Download" }).boundingBox(),
        bar.getByRole("button", { name: "Delete" }).boundingBox(),
      ]);
      if (!frame || !summary || !clear || !download || !remove)
        throw new Error("no box");
      // Inline-size containment leaves the bar the page's width.
      expect(frame.width).toBe(width);
      // The count and the clear button share the first row, the clear
      // button at the inline end; the actions follow on the next row.
      expect(clear.y).toBe(summary.y);
      expect(dir === "rtl" ? clear.x : clear.x + clear.width).toBe(
        dir === "rtl" ? frame.x : frame.x + frame.width,
      );
      expect(download.y).toBe(summary.y + summary.height);
      expect(remove.y).toBe(download.y);
      // The first action's text starts under the count's, give or take
      // the button's 1px transparent border.
      const [countText, actionText] = await Promise.all([
        textBox(bar.locator(".bx--selection-bar__summary")),
        textBox(bar.getByRole("button", { name: "Download" })),
      ]);
      const start = (box: { x: number; width: number }) =>
        dir === "rtl" ? box.x + box.width : box.x;
      expect(
        Math.abs(start(actionText) - start(countText)),
      ).toBeLessThanOrEqual(1);
    });
  }

  // The bar stacks below 672px, whatever its number of actions.
  for (const width of [672, 1024]) {
    test(`keeps every action on the count's row at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 480 });
      await page.goto("/selection-bar.html");
      const bar = page.getByTestId("bar");
      const tops = await Promise.all(
        [
          bar.locator(".bx--selection-bar__summary"),
          bar.getByRole("button", { name: "Download" }),
          bar.getByRole("button", { name: "Delete" }),
          bar.getByRole("button", { name: "Clear selection" }),
        ].map(async (part) => (await part.boundingBox())?.y),
      );
      expect(new Set(tops).size).toBe(1);
    });
  }

  test("mirrors in right-to-left", async ({ page }) => {
    await page.goto("/selection-bar.html");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const bar = page.getByTestId("bar");
    const [frame, summary, clear, icon, label] = await Promise.all([
      bar.boundingBox(),
      textBox(bar.locator(".bx--selection-bar__summary")),
      bar.getByRole("button", { name: "Clear selection" }).boundingBox(),
      bar
        .getByRole("button", { name: "Download" })
        .locator("svg")
        .boundingBox(),
      textBox(bar.getByRole("button", { name: "Download" })),
    ]);
    if (!frame || !clear || !icon) throw new Error("no box");
    // The count's text 16px in from the right, the clear button at the left.
    expect(frame.x + frame.width - (summary.x + summary.width)).toBeCloseTo(
      16,
      1,
    );
    expect(clear.x).toBe(frame.x);
    // The icon sits after the text, at the inline end, 8px from it.
    expect(Math.round(label.x - (icon.x + icon.width))).toBe(8);
  });

  test("plays no animation under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/selection-bar.html?animated");
    await page.getByRole("button", { name: "Clear selection" }).click();
    await expect(page.getByTestId("bar")).toHaveCount(0);
    await page.getByText("Billing").click();
    await expect(page.getByTestId("bar")).toBeVisible();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});
