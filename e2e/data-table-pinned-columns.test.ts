import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const SCROLLER = ".bx--data-table-content, .bx--data-table_inner-container";

async function open(page: Page, query = "") {
  await page.goto(`/data-table-pinned-columns.html?${query}`);
  await expect(page.locator("tbody tr").first()).toBeVisible();
}

function scrollTo(page: Page, left: number, top?: number) {
  return page.locator(SCROLLER).evaluate(
    (el, [x, y]) => {
      el.scrollTo({ left: x, top: y ?? el.scrollTop });
    },
    [left, top] as const,
  );
}

/** Left and right edge of each cell of the first body row. */
function edges(page: Page, selector = "tbody tr:first-child") {
  return page.evaluate((selector) => {
    const row = document.querySelector(selector);
    return [...(row?.children ?? [])].map((cell) => {
      const { left, right } = cell.getBoundingClientRect();
      return { left, right };
    });
  }, selector);
}

function background(cell: Locator) {
  return cell.evaluate((el) => getComputedStyle(el).backgroundColor);
}

test.describe("DataTable pinned columns", () => {
  test("holds pinned cells while the table scrolls, and scrolls the rest", async ({
    page,
  }) => {
    await open(page, "fixed&batch");
    const before = await edges(page);
    // checkbox, name, id, region, service, environment, owner, actions
    await scrollTo(page, 300);
    await expect
      .poll(() => page.locator(SCROLLER).evaluate((el) => el.scrollLeft))
      .toBe(300);
    const after = await edges(page);

    for (const i of [0, 1, 2, 7]) {
      expect(after[i].left).toBeCloseTo(before[i].left, 0);
    }
    expect(after[3].left).toBeCloseTo(before[3].left - 300, 0);
    // The end pin stays on the table's right edge.
    expect(after[7].right).toBeCloseTo(before[7].right, 0);
  });

  test("stacks pins so none overlaps another", async ({ page }) => {
    await open(page, "fixed&batch&expandable");
    await scrollTo(page, 200);
    const cells = await edges(page);

    // expand, checkbox, name, id (pinned start); actions (pinned end)
    for (const i of [0, 1, 2]) {
      expect(cells[i].right).toBeCloseTo(cells[i + 1].left, 0);
    }
  });

  test("raises the pinned cell that holds focus over the next pin", async ({
    page,
  }) => {
    await open(page, "fixed&batch");
    const row = page.locator("tbody tr").nth(1);
    await row.locator("input[type=checkbox]").focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");

    // The checkbox's ring runs past its cell, under the "Name" pin.
    const z = (index: number) =>
      row
        .locator("td")
        .nth(index)
        .evaluate((el) => Number(getComputedStyle(el).zIndex));
    expect(await z(0)).toBeGreaterThan(await z(1));
  });

  test("measures pins the table laid out wider or narrower than declared", async ({
    page,
  }) => {
    // Without `fixedLayout` an auto layout squeezes the declared widths.
    await open(page);
    await scrollTo(page, 120);
    const [name, id] = await edges(page);

    expect(id.left).toBeCloseTo(name.right, 0);
  });

  test("keeps the opaque background of the row state on a pinned cell", async ({
    page,
  }) => {
    await open(page, "fixed&batch&zebra");
    const rows = page.locator("tbody tr");

    // Selected, striped and plain rows each paint the pinned cell like the rest.
    const [selected, striped, plain] = await Promise.all(
      [0, 1, 2].map(async (index) => ({
        pinned: await background(rows.nth(index).locator("td").nth(1)),
        unpinned: await background(rows.nth(index).locator("td").nth(4)),
      })),
    );
    for (const { pinned, unpinned } of [selected, striped, plain]) {
      expect(pinned).not.toBe("rgba(0, 0, 0, 0)");
      expect(pinned).toBe(unpinned);
    }

    await rows.nth(3).hover();
    // The row's hover fill eases in, so wait for both cells to settle.
    await expect
      .poll(async () => {
        const pinned = await background(rows.nth(3).locator("td").nth(1));
        const unpinned = await background(rows.nth(3).locator("td").nth(4));
        const rest = await background(rows.nth(0).locator("td").nth(1));
        return pinned === unpinned && pinned !== rest;
      })
      .toBe(true);
  });

  test("opens an overflow menu in a pinned cell above the next row's pins", async ({
    page,
  }) => {
    await open(page, "fixed");
    await page
      .getByRole("button", { name: "Actions for Load balancer 0" })
      .click();
    const item = page.getByRole("menuitem", { name: "Delete" });
    await expect(item).toBeVisible();

    const top = await item.evaluate((el) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const hit = document.elementFromPoint(left + width / 2, top + height / 2);
      return el.contains(hit);
    });
    expect(top).toBe(true);
  });

  test.describe("with a sticky header", () => {
    test.beforeEach(async ({ page }) => {
      await open(page, "fixed&batch&stickyHeader");
    });

    test("keeps pinned headers in the corner while the body scrolls both ways", async ({
      page,
    }) => {
      const nameHeader = page.getByRole("columnheader", { name: "Name" });
      const scroller = page.locator(SCROLLER);
      const before = await nameHeader.boundingBox();

      await scrollTo(page, 300, 120);
      await expect
        .poll(() => scroller.evaluate((el) => el.scrollTop))
        .toBeGreaterThan(0);
      const after = await nameHeader.boundingBox();

      expect(after?.x).toBeCloseTo(before?.x ?? 0, 0);
      expect(after?.y).toBeCloseTo(before?.y ?? 0, 0);
    });

    test("scrolls body pins under the header cells above them", async ({
      page,
    }) => {
      await scrollTo(page, 300, 96);
      const onTop = await page.evaluate(() => {
        const names = ["Name", "Service", "Actions"];
        return names.map((name) => {
          const th = [...document.querySelectorAll("thead th")].find(
            (cell) => cell.textContent?.trim() === name,
          ) as HTMLElement;
          const { left, top, width, height } = th.getBoundingClientRect();
          const hit = document.elementFromPoint(
            left + width / 2,
            top + height / 2,
          );
          return th.contains(hit);
        });
      });

      // A pinned and an unpinned header cell both cover the body under them.
      expect(onTop).toEqual([true, true, true]);
    });
  });

  test("follows the text direction under rtl", async ({ page }) => {
    await open(page, "fixed&batch&rtl");
    const container = await page.getByTestId("pinned-root").boundingBox();
    const before = await edges(page);

    // Start pins sit at the right edge, the end pin at the left.
    expect(before[0].right).toBeCloseTo(
      (container?.x ?? 0) + (container?.width ?? 0),
      0,
    );
    expect(before[7].left).toBeCloseTo(container?.x ?? 0, 0);

    await scrollTo(page, -300);
    const after = await edges(page);
    for (const i of [0, 1, 2, 7]) {
      expect(after[i].left).toBeCloseTo(before[i].left, 0);
    }
    expect(after[3].left).toBeGreaterThan(before[3].left);
  });

  test("draws the edge dividers in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, "fixed");

    const colors = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "CanvasText";
      document.body.append(probe);
      const canvasText = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const line = (selector: string) =>
        getComputedStyle(document.querySelector(selector) as Element, "::after")
          .backgroundColor;
      return {
        canvasText,
        start: line("tbody td.bx--table-column--pinned-start-edge"),
        end: line("tbody td.bx--table-column--pinned-end-edge"),
      };
    });

    expect(colors.start).toBe(colors.canvasText);
    expect(colors.end).toBe(colors.canvasText);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await open(page, "fixed&batch&expandable");
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
