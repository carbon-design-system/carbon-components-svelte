import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// A tile's `decorator` and a selectable tile's checkbox sit in the top
// inline-end corner. The tile's text keeps clear of both, in every kind of
// tile, in both directions, and a tile without a decorator is left as it was.

type Rect = { left: number; right: number; top: number; bottom: number };

const KINDS = [
  "tile",
  "clickable-tile",
  "selectable-tile",
  "selectable-tile-selected",
  "selectable-tile-sm",
  "selectable-tile-docs",
  "radio-tile",
  "radio-tile-selected",
  "expandable-tile",
  "expandable-tile-expanded",
] as const;

// What sits in the corner: the decorator, the checkbox, the chevron.
const CORNER = ".bx--tile--inner-decorator, .bx--tile__checkmark";

/**
 * The rect of every line of the tile's text (Range.getClientRects, so a
 * wrapped paragraph is not one big box) and of each thing in the corner.
 * The decorator's own "AI" text is not the tile's text.
 */
function measure(page: Page, dir: string, id: string) {
  return page
    .getByTestId(`tiles-${dir}`)
    .getByTestId(id)
    .evaluate((host, corner) => {
      const rects = (list: DOMRectList): Rect[] =>
        [...list]
          .filter((r) => r.width > 0 && r.height > 0)
          .map((r) => ({
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
          }));

      const text: Rect[] = [];
      const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue;
        if (node.parentElement?.closest(corner)) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        text.push(...rects(range.getClientRects()));
      }
      const obstacles = [...host.querySelectorAll(corner)].flatMap((el) =>
        rects(el.getClientRects()),
      );
      const tile = host.querySelector(".bx--tile");
      const style = tile ? getComputedStyle(tile) : null;
      return {
        text,
        obstacles,
        paddingLeft: style?.paddingLeft,
        paddingRight: style?.paddingRight,
        width: host.getBoundingClientRect().width,
      };
    }, CORNER);
}

const overlaps = (a: Rect, b: Rect) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

test.describe("tile decorator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tile-decorator.html");
    await expect(page.getByTestId("tiles-ltr")).toBeVisible();
  });

  for (const dir of ["ltr", "rtl"]) {
    test.describe(dir, () => {
      for (const id of KINDS) {
        test(`${id} text clears the decorator and the checkbox`, async ({
          page,
        }) => {
          const { text, obstacles } = await measure(page, dir, id);
          expect(text.length).toBeGreaterThan(0);
          // The decorator and, on a selectable tile, the checkbox.
          expect(obstacles.length).toBeGreaterThanOrEqual(1);
          const hits = text.flatMap((t) =>
            obstacles.filter((o) => overlaps(t, o)).map(() => t),
          );
          expect(hits).toEqual([]);
        });
      }

      test("a selectable tile's checkbox and decorator do not overlap", async ({
        page,
      }) => {
        const { obstacles } = await measure(page, dir, "selectable-tile");
        expect(obstacles).toHaveLength(2);
        expect(overlaps(obstacles[0], obstacles[1])).toBe(false);
      });
    });
  }

  test("the corner is the inline end", async ({ page }) => {
    for (const dir of ["ltr", "rtl"]) {
      // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
      const { obstacles, width } = await measure(page, dir, "selectable-tile");
      const host = page
        .getByTestId(`tiles-${dir}`)
        .getByTestId("selectable-tile");
      const box = await host.boundingBox();
      if (!box) throw new Error("no box");
      const mid = box.x + width / 2;
      for (const o of obstacles) {
        if (dir === "ltr") expect(o.left).toBeGreaterThan(mid);
        else expect(o.right).toBeLessThan(mid);
      }
    }
  });

  test("a tile without a decorator keeps its padding", async ({ page }) => {
    const plain = await measure(page, "ltr", "tile-plain");
    expect(plain.paddingLeft).toBe("16px");
    expect(plain.paddingRight).toBe("16px");
    const selectable = await measure(page, "ltr", "selectable-tile-plain");
    expect(selectable.paddingLeft).toBe("16px");
    expect(selectable.paddingRight).toBe("48px");

    // The same, mirrored.
    const rtl = await measure(page, "rtl", "selectable-tile-plain");
    expect(rtl.paddingLeft).toBe("48px");
    expect(rtl.paddingRight).toBe("16px");
  });
});
