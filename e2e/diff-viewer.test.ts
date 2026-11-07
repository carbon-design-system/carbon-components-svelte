import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const SPLIT = "[data-testid=split]";
const UNIFIED = "[data-testid=unified]";
const LARGE = "[data-testid=large]";
const LONG = "[data-testid=long]";
const WRAP = "[data-testid=wrap]";

const scroller = (page: Page, root: string) =>
  page.locator(`${root} .bx--diff-viewer__scroller`);

async function open(page: Page) {
  await page.goto("/diff-viewer.html");
  await expect(
    page.locator(`${SPLIT} .bx--diff-viewer__row`).first(),
  ).toBeVisible();
}

test.describe("DiffViewer", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await open(page);

    const white = await new AxeBuilder({ page }).include("#app").analyze();
    expect(white.violations).toEqual([]);

    // Colors animate between themes, and axe would read the frames between.
    await page.addStyleTag({
      content: "*, *::before, *::after { transition: none !important; }",
    });
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    const dark = await new AxeBuilder({ page }).include("#app").analyze();
    expect(dark.violations).toEqual([]);
  });

  test("renders rows by window, however long the file", async ({ page }) => {
    await open(page);

    const rows = page.locator(`${LARGE} .bx--diff-viewer__row`);
    expect(await rows.count()).toBeLessThan(120);
    const height = await scroller(page, LARGE).evaluate(
      (el) => el.scrollHeight,
    );
    // 10,000 split rows of 20px.
    expect(height).toBeGreaterThan(190_000);

    await scroller(page, LARGE).evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(
      page.locator(`${LARGE} .bx--diff-viewer__row`).last(),
    ).toContainText("value10000");
    expect(await rows.count()).toBeLessThan(120);
  });

  test("jumps to the next and previous change with F7", async ({ page }) => {
    await open(page);
    const view = scroller(page, LARGE);
    await view.focus();

    await page.keyboard.press("F7");
    await expect(
      page.locator(`${LARGE} .bx--diff-viewer__row--current`).first(),
    ).toBeVisible();
    await expect(page.locator(`${LARGE} .bx--diff-viewer__status`)).toHaveText(
      "Change 1 of 40",
    );
    const first = await view.evaluate((el) => el.scrollTop);

    await page.keyboard.press("F7");
    await expect(page.locator(`${LARGE} .bx--diff-viewer__status`)).toHaveText(
      "Change 2 of 40",
    );
    // 250 rows of 20px apart.
    await expect
      .poll(() => view.evaluate((el) => el.scrollTop))
      .toBeCloseTo(first + 5000, -2);

    await page.keyboard.press("Shift+F7");
    await page.keyboard.press("Shift+F7");
    await expect(page.locator(`${LARGE} .bx--diff-viewer__status`)).toHaveText(
      "Change 40 of 40",
    );
    const current = page.locator(`${LARGE} .bx--diff-viewer__row--current`);
    await expect(current.first()).toContainText("value10000");
    await expect(current.first()).toBeInViewport();
  });

  test("shows folded lines on request", async ({ page }) => {
    await open(page);

    const fold = page.locator(`${UNIFIED} .bx--diff-viewer__expand`).first();
    await expect(fold).toHaveText("Show 3 hidden lines");
    await fold.click();
    await expect(
      page.locator(`${UNIFIED} .bx--diff-viewer__code`, {
        hasText: "export function describe",
      }),
    ).toBeVisible();
  });

  test("selects text in one half of the split view only", async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      document.body.style.userSelect = "auto";
    });
    const cell = page
      .locator(`${SPLIT} .bx--diff-viewer__cell--delete .bx--diff-viewer__code`)
      .first();
    await cell.dblclick();
    const other = await page
      .locator(`${SPLIT} .bx--diff-viewer__cell[data-side=new]`)
      .first()
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return style.userSelect || style.webkitUserSelect;
      });
    expect(other).toBe("none");
  });

  test("keeps the hidden added and removed text out of copied text", async ({
    page,
  }) => {
    await open(page);

    const selected = await page.evaluate((selector) => {
      const list = document.querySelector(`${selector} .bx--diff-viewer__list`);
      const selection = getSelection();
      if (!list || !selection) return "";
      const range = document.createRange();
      range.selectNodeContents(list);
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    }, UNIFIED);
    expect(selected).not.toMatch(/Added line|Removed line/);
    expect(selected).toContain("readFile(resolve(path)");
  });

  test("finds a change among rows of unknown height when lines wrap", async ({
    page,
  }) => {
    await open(page);
    const view = scroller(page, WRAP);
    await view.focus();

    for (const n of [1, 2, 3, 4, 5]) {
      // biome-ignore lint/performance/noAwaitInLoops: each jump must land before the next
      await page.keyboard.press("F7");
      await expect(page.locator(`${WRAP} .bx--diff-viewer__status`)).toHaveText(
        `Change ${n} of 5`,
      );
      const current = page.locator(`${WRAP} .bx--diff-viewer__row--current`);
      await expect(current.first()).toContainText(`row ${n * 400}`);
      await expect(current.first()).toBeInViewport();
    }
  });

  test("scrolls very long lines sideways, one row high", async ({ page }) => {
    await open(page);

    const view = scroller(page, LONG);
    const sizes = await view.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(sizes.scrollWidth).toBeGreaterThan(sizes.clientWidth * 10);
    const heights = await page
      .locator(`${LONG} .bx--diff-viewer__row`)
      .evaluateAll((rows) =>
        rows.map((row) => row.getBoundingClientRect().height),
      );
    expect(new Set(heights).size).toBe(1);
  });

  test("has a keyboard-reachable scroller with a visible focus ring", async ({
    page,
  }) => {
    await open(page);
    const view = scroller(page, SPLIT);

    await view.focus();

    await expect(view).toBeFocused();
    const outline = await view.evaluate(
      (el) => getComputedStyle(el).outlineStyle,
    );
    expect(outline).not.toBe("none");
  });
});

test.describe("DiffViewer in a right-to-left page", () => {
  test("keeps the code reading left to right", async ({ page }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );

    const view = scroller(page, SPLIT);
    expect(await view.evaluate((el) => getComputedStyle(el).direction)).toBe(
      "ltr",
    );

    const box = async (locator: Locator) => {
      const found = await locator.boundingBox();
      if (!found) throw new Error("not rendered");
      return found;
    };
    const numbers = page
      .locator(`${UNIFIED} .bx--diff-viewer__row--insert`)
      .first();
    const number = await box(
      numbers.locator(".bx--diff-viewer__number").nth(1),
    );
    const code = await box(numbers.locator(".bx--diff-viewer__code"));
    expect(number.x).toBeLessThan(code.x);

    // The toolbar around the code does mirror.
    const toolbar = page.locator(`${UNIFIED} .bx--diff-viewer__toolbar`);
    const summary = await box(toolbar.locator(".bx--diff-viewer__summary"));
    const actions = await box(toolbar.locator(".bx--diff-viewer__actions"));
    expect(summary.x).toBeGreaterThan(actions.x);
  });
});

test.describe("DiffViewer in forced colors", () => {
  test("marks changes without color: signs, hidden text, underlined words", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);

    const markers = await page
      .locator(
        `${UNIFIED} .bx--diff-viewer__row--insert .bx--diff-viewer__marker`,
      )
      .first()
      .evaluate((el) => ({
        text: el.textContent,
        color: getComputedStyle(el).color,
      }));
    expect(markers.text).toBe("+");
    expect(markers.color).not.toBe("rgba(0, 0, 0, 0)");

    const word = page.locator(`${UNIFIED} .bx--diff-viewer__word`).first();
    expect(
      await word.evaluate((el) => getComputedStyle(el).textDecorationLine),
    ).toBe("underline");

    await scroller(page, UNIFIED).focus();
    await page.keyboard.press("F7");
    const bar = await page
      .locator(`${UNIFIED} .bx--diff-viewer__row--current`)
      .first()
      .evaluate((el) => {
        const style = getComputedStyle(el, "::after");
        return {
          width: style.borderInlineStartWidth,
          style: style.borderInlineStartStyle,
        };
      });
    expect(bar).toEqual({ width: "4px", style: "solid" });

    const focus = await scroller(page, UNIFIED).evaluate(
      (el) => getComputedStyle(el).outlineStyle,
    );
    expect(focus).not.toBe("none");
  });
});
