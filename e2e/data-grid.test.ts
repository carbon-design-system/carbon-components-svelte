import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const BIG = "rows=10000&columns=50&frozenRows=1&frozenColumns=2&height=400";

const grid = (page: Page) => page.getByRole("grid", { name: "Sales" });
const cell = (page: Page, row: number, column: number) =>
  page.locator(`[role="gridcell"][data-row="${row}"][data-column="${column}"]`);
const state = async (page: Page) =>
  JSON.parse((await page.getByTestId("state").textContent()) ?? "{}");

/** Whether `inner` lies inside `outer`, to a pixel. */
async function inside(inner: Locator, outer: Locator) {
  const [a, b] = await Promise.all([inner.boundingBox(), outer.boundingBox()]);
  if (!a || !b) return false;
  return (
    a.x >= b.x - 1 &&
    a.y >= b.y - 1 &&
    a.x + a.width <= b.x + b.width + 1 &&
    a.y + a.height <= b.y + b.height + 1
  );
}

test.describe("DataGrid", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto(`/data-grid.html?${BIG}`);
    await cell(page, 3, 3).click();
    await page.keyboard.press("Shift+ArrowDown");
    await page.keyboard.press("Shift+ArrowRight");

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("has no violations in Gray 100", async ({ page }) => {
    await page.goto("/data-grid.html?frozenRows=1&frozenColumns=1&theme=g100");
    await cell(page, 3, 3).click();
    await page.keyboard.press("Shift+ArrowDown");

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("has no violations right to left", async ({ page }) => {
    await page.goto("/data-grid.html?frozenRows=1&frozenColumns=1&dir=rtl");
    await cell(page, 3, 3).click();
    await page.keyboard.press("Shift+ArrowDown");

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("is one tab stop", async ({ page }) => {
    await page.goto("/data-grid.html");
    await page.getByTestId("before").focus();

    await page.keyboard.press("Tab");
    await expect(cell(page, 0, 0)).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Tab");
    // WebKit on macOS does not tab to buttons, so check the grid was left
    // rather than which control comes next.
    await expect(page.locator('[role="gridcell"]:focus')).toHaveCount(0);

    // Back in, Shift+Tab returns to the cell the grid left off at.
    await page.keyboard.press("Shift+Tab");
    await expect(cell(page, 1, 1)).toBeFocused();
  });

  test("paints a bounded window of 500,000 cells and counts all of them", async ({
    page,
  }) => {
    await page.goto(`/data-grid.html?${BIG}`);

    await expect(grid(page)).toHaveAttribute("aria-rowcount", "10001");
    await expect(grid(page)).toHaveAttribute("aria-colcount", "51");
    expect(await page.locator('[role="gridcell"]').count()).toBeLessThan(500);

    await cell(page, 0, 0).click();
    await page.keyboard.press("Control+End");
    await expect(cell(page, 9999, 49)).toBeFocused();

    // After a jump a third of the way across 10,000 rows, the window and the
    // indexes of what is painted follow, and the count does not change.
    await expect(cell(page, 9999, 49)).toHaveAttribute("aria-colindex", "51");
    await expect(page.getByRole("row").last()).toHaveAttribute(
      "aria-rowindex",
      "10001",
    );
    expect(await page.locator('[role="gridcell"]').count()).toBeLessThan(500);
    await expect(grid(page)).toHaveAttribute("aria-rowcount", "10001");
  });

  test("never hides the focused cell under the frozen rows or columns", async ({
    page,
  }) => {
    await page.goto(`/data-grid.html?${BIG}`);
    await cell(page, 5, 5).click();

    // The cell has to clear the row headers' right edge and the frozen
    // row's bottom edge, which a plain `focus()` would not.
    const clear = () =>
      page.evaluate(() => {
        const focused = document.querySelector('[role="gridcell"]:focus');
        const edge = document.querySelector(
          '[role="columnheader"].bx--data-grid__frozen--edge',
        );
        const frozenRow = document.querySelector('[aria-rowindex="2"]');
        const gridBox = document
          .querySelector('[role="grid"]')
          ?.getBoundingClientRect();
        if (!focused || !edge || !frozenRow || !gridBox) return false;
        const box = focused.getBoundingClientRect();
        return (
          box.left >= edge.getBoundingClientRect().right - 1 &&
          box.top >= frozenRow.getBoundingClientRect().bottom - 1 &&
          box.right <= gridBox.right + 1 &&
          box.bottom <= gridBox.bottom + 1
        );
      });

    for (const key of [
      "PageDown",
      "PageDown",
      "ArrowRight",
      "ArrowRight",
      "ArrowRight",
      "ArrowRight",
      "ArrowRight",
      "ArrowRight",
      "Alt+PageDown",
      "ArrowUp",
      "ArrowLeft",
      "PageUp",
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: one key at a time
      await page.keyboard.press(key);
      expect(await clear(), `after ${key}`).toBe(true);
    }
  });

  test("goes back to the start for a frozen cell", async ({ page }) => {
    await page.goto(`/data-grid.html?${BIG}`);
    await cell(page, 0, 0).click();
    await page.keyboard.press("Control+End");
    await expect(cell(page, 9999, 49)).toBeFocused();

    await page.keyboard.press("Control+Home");

    await expect(cell(page, 0, 0)).toBeFocused();
    expect(
      await grid(page).evaluate((node) => [node.scrollTop, node.scrollLeft]),
    ).toEqual([0, 0]);
  });

  test("selects with the keyboard and the pointer", async ({ page }) => {
    await page.goto("/data-grid.html");
    await cell(page, 1, 1).click();
    await page.keyboard.press("Shift+ArrowDown");
    await page.keyboard.press("Shift+ArrowRight");

    expect((await state(page)).selection).toEqual({
      startRow: 1,
      startColumn: 1,
      endRow: 2,
      endColumn: 2,
    });
    await expect(page.locator('[aria-selected="true"]')).toHaveCount(4);
    await expect(
      page.getByRole("status").filter({ hasText: "selected" }),
    ).toHaveText("2 rows by 2 columns selected");

    const from = await cell(page, 2, 2).boundingBox();
    const to = await cell(page, 5, 4).boundingBox();
    if (!from || !to) throw new Error("cells are not painted");
    await page.mouse.move(from.x + 10, from.y + 10);
    await page.mouse.down();
    await page.mouse.move(to.x + 10, to.y + 10, { steps: 6 });
    await page.mouse.up();

    expect((await state(page)).selection).toEqual({
      startRow: 2,
      startColumn: 2,
      endRow: 5,
      endColumn: 4,
    });
    await expect(page.locator('[aria-selected="true"]')).toHaveCount(12);
    await expect(cell(page, 2, 2)).toBeFocused();
  });

  test("scrolls while a drag is held past the edge", async ({ page }) => {
    await page.goto(`/data-grid.html?${BIG}`);
    const box = await grid(page).boundingBox();
    const from = await cell(page, 3, 3).boundingBox();
    if (!box || !from) throw new Error("grid is not painted");

    await page.mouse.move(from.x + 10, from.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 40, {
      steps: 4,
    });
    await expect
      .poll(async () => (await state(page)).selection?.endRow ?? 0)
      .toBeGreaterThan(30);
    await page.mouse.up();
  });

  test("selects a column, a row and everything from the headers and keys", async ({
    page,
  }) => {
    await page.goto("/data-grid.html");
    await cell(page, 4, 2).click();

    await grid(page).getByRole("columnheader", { name: "Column 3" }).click();
    expect((await state(page)).selection).toEqual({
      startRow: 0,
      startColumn: 3,
      endRow: 39,
      endColumn: 3,
    });

    await grid(page).getByRole("rowheader", { name: "7", exact: true }).click();
    expect((await state(page)).selection).toEqual({
      startRow: 6,
      startColumn: 0,
      endRow: 6,
      endColumn: 11,
    });

    await page.keyboard.press("ControlOrMeta+A");
    expect((await state(page)).selection).toEqual({
      startRow: 0,
      startColumn: 0,
      endRow: 39,
      endColumn: 11,
    });
  });

  test("swaps the horizontal arrows right to left and keeps the frozen column at the start", async ({
    page,
  }) => {
    await page.goto(`/data-grid.html?${BIG}&dir=rtl`);
    await cell(page, 0, 3).click();

    await page.keyboard.press("ArrowLeft");
    await expect(cell(page, 0, 4)).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(cell(page, 0, 2)).toBeFocused();

    const box = await grid(page).boundingBox();
    const frozen = await cell(page, 0, 0).boundingBox();
    const rowHeader = await grid(page)
      .getByRole("rowheader")
      .first()
      .boundingBox();
    if (!box || !frozen || !rowHeader) throw new Error("grid is not painted");
    // The row headers sit at the right edge, where an RTL page starts, and
    // frozen column 0 is next to them.
    expect(
      Math.abs(box.x + box.width - (rowHeader.x + rowHeader.width)),
    ).toBeLessThan(20);
    expect(Math.abs(rowHeader.x - (frozen.x + frozen.width))).toBeLessThan(2);

    await page.keyboard.press("Control+End");
    await expect(cell(page, 9999, 49)).toBeFocused();
    expect(await inside(cell(page, 9999, 49), grid(page))).toBe(true);
    // Scrolled to the far end, the frozen column has not moved.
    const stuck = await cell(page, 9999, 0).boundingBox();
    if (!stuck) throw new Error("frozen cell is not painted");
    expect(Math.abs(stuck.x - frozen.x)).toBeLessThan(2);
  });

  test("keeps signed numbers and fractions in order right to left", async ({
    page,
  }) => {
    await page.goto("/data-grid.html?dir=rtl");

    // The x of each character, in the order they are written.
    const xs = (row: number, column: number) =>
      cell(page, row, column).evaluate((node) => {
        const text = node.querySelector(".bx--data-grid__text")?.firstChild;
        if (!text?.textContent) return [];
        const range = document.createRange();
        return [...text.textContent].map((_, i) => {
          range.setStart(text, i);
          range.setEnd(text, i + 1);
          return range.getBoundingClientRect().left;
        });
      });

    const signed = await xs(3, 1);
    expect(signed).toHaveLength(4);
    expect(signed).toEqual([...signed].sort((a, b) => a - b));
    const fraction = await xs(3, 2);
    expect(fraction).toHaveLength(5);
    expect(fraction).toEqual([...fraction].sort((a, b) => a - b));
  });

  test("keeps the selection visible in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/data-grid.html?frozenColumns=1");
    await cell(page, 2, 2).click();
    await page.keyboard.press("Shift+ArrowDown");
    await page.keyboard.press("Shift+ArrowRight");

    const edge = await cell(page, 2, 2).evaluate((node) => {
      const probe = document.createElement("span");
      probe.style.color = "Highlight";
      document.body.append(probe);
      const highlight = getComputedStyle(probe).color;
      probe.remove();
      const after = getComputedStyle(node, "::after");
      return {
        highlight,
        top: after.borderTopColor,
        topWidth: after.borderTopWidth,
        start: after.borderLeftColor,
        startWidth: after.borderLeftWidth,
        bottomWidth: after.borderBottomWidth,
      };
    });

    expect(edge.top).toBe(edge.highlight);
    expect(edge.topWidth).toBe("2px");
    expect(edge.start).toBe(edge.highlight);
    expect(edge.startWidth).toBe("2px");
    // An inner edge draws nothing.
    expect(edge.bottomWidth).toBe("0px");
    await expect(page.locator('[aria-selected="true"]')).toHaveCount(4);

    const header = await grid(page)
      .getByRole("columnheader", { name: "Column 2" })
      .evaluate((node) => {
        const probe = document.createElement("span");
        probe.style.backgroundColor = "Highlight";
        document.body.append(probe);
        const highlight = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return { highlight, color: getComputedStyle(node).backgroundColor };
      });
    expect(header.color).toBe(header.highlight);
  });

  test.describe("clipboard", () => {
    test.beforeEach(({ browserName }) => {
      test.skip(
        browserName !== "chromium",
        "Only Chromium grants clipboard permissions",
      );
    });

    test.beforeEach(async ({ context }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    });

    test("copies the selection as TSV and HTML", async ({ page }) => {
      await page.goto("/data-grid.html");
      await cell(page, 1, 0).click();
      await page.keyboard.press("Shift+ArrowRight");
      await page.keyboard.press("Shift+ArrowRight");
      await page.keyboard.press("Shift+ArrowDown");

      await page.keyboard.press("ControlOrMeta+C");

      // Row 1 holds a quote, a tab and a line break.
      const { text, html } = await page.evaluate(async () => {
        const [item] = await navigator.clipboard.read();
        const read = async (type: string) =>
          item.types.includes(type)
            ? await (await item.getType(type)).text()
            : "";
        return {
          text: await read("text/plain"),
          html: await read("text/html"),
        };
      });
      expect(text).toBe(
        'Item 2\t"He said ""hi"""\t"two\nlines"\nItem 3\t"a\tb"\t202',
      );
      expect(html).toContain("<td>Item 2</td>");
      // Chromium sanitizes the clipboard's HTML on the way back.
      expect(html).toContain('<td>He said "hi"</td>');
      await expect(page.getByRole("status")).toHaveText(
        "Copied 2 rows by 3 columns",
      );
    });

    test("hands a pasted matrix to the consumer, which writes the values", async ({
      page,
    }) => {
      await page.goto("/data-grid.html");
      await page.evaluate(() => navigator.clipboard.writeText("x\ty\n1\t2"));
      await cell(page, 5, 4).click();

      await page.keyboard.press("ControlOrMeta+V");

      expect(
        JSON.parse((await page.getByTestId("paste-log").textContent()) ?? ""),
      ).toEqual({
        matrix: [
          ["x", "y"],
          ["1", "2"],
        ],
        range: { startRow: 5, startColumn: 4, endRow: 6, endColumn: 5 },
        truncated: false,
      });
      await expect(cell(page, 5, 4)).toHaveText("x");
      await expect(cell(page, 6, 5)).toHaveText("2");
      expect((await state(page)).selection).toEqual({
        startRow: 5,
        startColumn: 4,
        endRow: 6,
        endColumn: 5,
      });
    });

    test("leaves the cells and the selection alone when the consumer cancels", async ({
      page,
    }) => {
      await page.goto("/data-grid.html");
      await page.evaluate(() => navigator.clipboard.writeText("x\ty"));
      await page.getByTestId("cancel-paste").check();
      await cell(page, 5, 4).click();

      await page.keyboard.press("ControlOrMeta+V");

      await expect(page.getByTestId("paste-log")).not.toBeEmpty();
      await expect(cell(page, 5, 4)).toHaveText("504");
      expect((await state(page)).selection).toBeNull();
    });
  });
});
