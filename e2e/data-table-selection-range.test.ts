import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const ROW_HEIGHT = 48;
const COUNT = 10000;

// The fixture's score is a permutation of 0..9999, so a sort by score shuffles
// the names. Rebuilding its order here is how the test knows what a range in
// the shown order must hold.
const score = (id: number) => (id * 7919) % 10007;
const byScore = (ids: number[]) => [...ids].sort((a, b) => score(a) - score(b));
const all = Array.from({ length: COUNT }, (_, id) => id);
const matching = all.filter((id) => `Row ${id}`.includes("Row 1"));

const scroller = (page: Page) =>
  page.locator("[data-testid=selection-range-root] .bx--data-table-virtual");
const count = (page: Page) =>
  page.getByTestId("selected-count").evaluate((el) => Number(el.textContent));
const ids = async (page: Page) =>
  (await page.getByTestId("selected-ids").textContent())
    ?.split(",")
    .filter(Boolean)
    .map(Number) ?? [];

/** Scroll until the row at `index` of the shown order is mounted, and return its cell. */
async function rowAt(page: Page, id: number, index: number): Promise<Locator> {
  await scroller(page).evaluate(
    (el, top) => {
      el.scrollTop = top;
    },
    Math.max(0, index * ROW_HEIGHT - 150),
  );
  const cell = page.locator(`tr[data-row="${id}"] td`).last();
  await expect(cell).toBeVisible();
  return cell;
}

const focusedRow = (page: Page) =>
  page.evaluate(
    () => (document.activeElement as HTMLInputElement | null)?.value ?? null,
  );

test.describe("DataTable selectionRange", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-table-selection-range.html");
    await expect(page.locator("tr[data-row]").first()).toBeVisible();
  });

  test("Shift+click across a filtered, sorted and virtualized 10k table", async ({
    page,
  }) => {
    await page.getByRole("searchbox").fill("Row 1");
    await page.getByRole("button", { name: "Score" }).click();
    const shown = byScore(matching);
    expect(shown.length).toBe(1111);

    await (await rowAt(page, shown[0], 0)).click();
    await expect.poll(() => count(page)).toBe(1);

    await (await rowAt(page, shown[900], 900)).click({ modifiers: ["Shift"] });
    await expect.poll(() => count(page)).toBe(901);
    expect(await ids(page)).toEqual(shown.slice(0, 901));

    // A text selection would run across the rows.
    expect(await page.evaluate(() => getSelection()?.toString())).toBe("");

    // The anchor stays, so a shorter range shrinks.
    await (await rowAt(page, shown[400], 400)).click({ modifiers: ["Shift"] });
    await expect.poll(() => count(page)).toBe(401);
    expect(await ids(page)).toEqual(shown.slice(0, 401));
  });

  test("Cmd or Ctrl+click toggles, and the selection survives a re-sort", async ({
    page,
  }) => {
    await (await rowAt(page, 5, 5)).click();
    await (await rowAt(page, 9, 9)).click({ modifiers: ["ControlOrMeta"] });
    await expect.poll(() => count(page)).toBe(2);
    await page.getByRole("button", { name: "Score" }).click();
    expect((await ids(page)).sort((a, b) => a - b)).toEqual([5, 9]);
    await page.getByRole("button", { name: "Score" }).click();
    await expect.poll(() => count(page)).toBe(2);
  });

  test("keyboard only: Shift+arrows through the window, Home, End, Ctrl+A, Escape", async ({
    page,
  }) => {
    await page.locator('tr[data-row="0"] input[type=checkbox]').focus();

    await page.keyboard.press("ArrowDown");
    expect(await focusedRow(page)).toBe("1");
    expect(await count(page)).toBe(0);

    await page.keyboard.press("Shift+ArrowDown");
    await page.keyboard.press("Shift+ArrowDown");
    expect(await focusedRow(page)).toBe("3");
    await expect.poll(() => count(page)).toBe(3);
    expect(await ids(page)).toEqual([1, 2, 3]);

    // The status region says the count once, after the quiet time.
    await expect(
      page.getByRole("status").filter({ hasText: "selected" }),
    ).toHaveText("3 selected");

    // 200 presses cross the window many times over.
    for (let press = 0; press < 200; press++) {
      await page.keyboard.press("Shift+ArrowDown");
    }
    await expect.poll(() => focusedRow(page)).toBe("203");
    await expect.poll(() => count(page)).toBe(203);

    await page.keyboard.press("End");
    await expect.poll(() => focusedRow(page)).toBe(String(COUNT - 1));
    await page.keyboard.press("Home");
    await expect.poll(() => focusedRow(page)).toBe("0");
    expect(await count(page)).toBe(203);

    await page.keyboard.press("ControlOrMeta+a");
    await expect.poll(() => count(page)).toBe(COUNT);
    await expect(
      page.getByRole("status").filter({ hasText: "selected" }),
    ).toHaveText("10000 selected");

    await page.keyboard.press("Escape");
    await expect.poll(() => count(page)).toBe(0);
  });

  test("works under dir=rtl", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await (await rowAt(page, 2, 2)).click();
    await (await rowAt(page, 5, 5)).click({ modifiers: ["Shift"] });
    await expect.poll(() => count(page)).toBe(4);
    await expect(
      page.locator("tr.bx--data-table--selected[data-row]"),
    ).toHaveCount(4);

    // The checkbox column sits at the inline start: the right edge.
    const box = await page.locator('tr[data-row="2"] input').boundingBox();
    const cell = await page.locator('tr[data-row="2"] td').last().boundingBox();
    expect(box && cell && box.x > cell.x).toBe(true);

    await page.locator('tr[data-row="2"] input[type=checkbox]').focus();
    await page.keyboard.press("Shift+ArrowDown");
    expect(await focusedRow(page)).toBe("3");
    await expect.poll(() => count(page)).toBe(2);
  });

  test("a selected row differs from an unselected one in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await (await rowAt(page, 2, 2)).click();
    await expect.poll(() => count(page)).toBe(1);
    await page.mouse.move(0, 0);
    const style = (id: number) =>
      page
        .locator(`tr[data-row="${id}"] td`)
        .last()
        .evaluate((el) => {
          const css = getComputedStyle(el);
          return `${css.backgroundColor}|${css.borderTopColor}|${css.borderTopWidth}|${css.outlineStyle}`;
        });
    expect(await style(2)).not.toBe(await style(4));
    // Carbon fades the row's background; read it once it has settled.
    await page.waitForTimeout(400);
    const resting = await style(2);
    await page.locator('tr[data-row="2"] td').last().hover();
    await page.waitForTimeout(400);
    expect(await style(2)).toBe(resting);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await (await rowAt(page, 2, 2)).click();
    await (await rowAt(page, 5, 5)).click({ modifiers: ["Shift"] });
    await page.locator('tr[data-row="5"] input[type=checkbox]').focus();
    await expect.poll(() => count(page)).toBe(4);
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});
