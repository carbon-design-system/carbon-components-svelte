import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { expectSingleRing } from "./helpers/layout";

const grid = (page: Page, testid: string) =>
  page.getByTestId(testid).getByRole("treegrid");

async function press(page: Page, key: string, times: number) {
  for (let i = 0; i < times; i++) {
    // biome-ignore lint/performance/noAwaitInLoops: each key follows the last
    await page.keyboard.press(key);
  }
}

const activeCell = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? `${el.getAttribute("role")}:${el.textContent?.trim()}` : "";
  });

/** The cell is inside the scrollport and clear of the sticky header and column. */
async function expectClearOfPins(scroll: Locator, cell: Locator) {
  const [s, c, header, first] = await Promise.all([
    scroll.boundingBox(),
    cell.boundingBox(),
    scroll.locator("thead").boundingBox(),
    scroll.locator("tbody tr").first().locator("td").first().boundingBox(),
  ]);
  if (!(s && c && header && first)) throw new Error("no box");
  const rtl = await scroll.evaluate(
    (el) => getComputedStyle(el).direction === "rtl",
  );
  expect(c.y).toBeGreaterThanOrEqual(s.y + header.height - 1);
  expect(c.y + c.height).toBeLessThanOrEqual(s.y + s.height + 1);
  if (rtl) {
    expect(c.x + c.width).toBeLessThanOrEqual(s.x + s.width - first.width + 1);
  } else {
    expect(c.x).toBeGreaterThanOrEqual(s.x + first.width - 1);
  }
}

test.describe("PivotTable", () => {
  test("renders the collapsed pivot with grand totals", async ({ page }) => {
    await page.goto("/pivot-table.html");
    const table = grid(page, "basic");
    await expect(table).toBeVisible();
    await expect(table.getByRole("rowheader")).toHaveText([
      "Americas",
      "Asia",
      "Europe",
      "Grand total",
    ]);
    await expect(table.getByRole("columnheader")).toHaveText([
      "Region / Country",
      "2023",
      "2024",
      "2025",
      "Grand total",
    ]);
    await expect(table.getByRole("row").nth(1)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("exposes the tree and the headers in the accessibility tree", async ({
    page,
  }) => {
    await page.goto("/pivot-table.html");
    const table = grid(page, "multi");
    const basic = grid(page, "basic");
    await basic.getByRole("rowheader", { name: "Americas" }).click();
    // The tree as Chromium exposes it: levels and the expanded state on rows.
    const snapshot = await basic.ariaSnapshot();
    expect(snapshot).toContain('treegrid "Sales by region"');
    expect(snapshot).toMatch(/row "Americas [^"]*" \[expanded\] \[level=1\]/);
    expect(snapshot).toMatch(/row "Brazil [^"]*" \[level=2\]/);
    expect(snapshot).toMatch(/row "Asia [^"]*" \[level=1\]/);
    await expect(basic).toHaveAttribute("aria-readonly", "true");
    // Two header rows (year, then value), so a cell sits under two headers.
    await expect(table.locator("thead tr")).toHaveCount(2);
    await expect(table.locator("thead th").first()).toHaveAttribute(
      "rowspan",
      "2",
    );
    await expect(table.locator("thead th[colspan]").first()).toHaveAttribute(
      "scope",
      "colgroup",
    );
  });

  test("has one tab stop and moves by arrow key", async ({ page }) => {
    await page.goto("/pivot-table.html");
    const table = grid(page, "basic");
    await expect(table.locator("[tabindex='0']")).toHaveCount(1);
    await page
      .getByTestId("basic")
      .getByRole("button", { name: "Export CSV" })
      .focus();
    await page.keyboard.press("Tab");
    expect(await activeCell(page)).toBe("rowheader:Americas");
    await page.keyboard.press("ArrowRight");
    expect(await activeCell(page)).toBe("gridcell:$879,805");
    await page.keyboard.press("ArrowDown");
    expect(await activeCell(page)).toBe("gridcell:$1,078,957");
    await page.keyboard.press("End");
    expect(await activeCell(page)).toBe("gridcell:$3,207,077");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    expect(await activeCell(page)).toBe("columnheader:Grand total");
    await page.keyboard.press("Home");
    expect(await activeCell(page)).toBe("columnheader:Region / Country");
    await page.keyboard.press("Control+End");
    expect(await activeCell(page)).toBe("gridcell:$9,152,014");
    await page.keyboard.press("Control+Home");
    expect(await activeCell(page)).toBe("columnheader:Region / Country");
    // Tab leaves the grid in one press.
    await page.keyboard.press("Tab");
    await expect(table.locator(":focus")).toHaveCount(0);
  });

  test("opens and closes groups by keyboard and mouse", async ({ page }) => {
    await page.goto("/pivot-table.html");
    const root = page.getByTestId("basic");
    const table = grid(page, "basic");
    await table.getByRole("rowheader", { name: "Americas" }).focus();
    await page.keyboard.press("Enter");
    await expect(table.getByRole("rowheader")).toHaveText([
      "Americas",
      "Brazil",
      "Canada",
      "United States",
      "Asia",
      "Europe",
      "Grand total",
    ]);
    const americas = table.getByRole("row").nth(1);
    await expect(americas).toHaveAttribute("aria-expanded", "true");
    await expect(table.getByRole("row").nth(2)).toHaveAttribute(
      "aria-level",
      "2",
    );
    await expect(table.getByRole("row").nth(2)).toHaveAttribute(
      "aria-posinset",
      "1",
    );
    await expect(table.getByRole("row").nth(2)).toHaveAttribute(
      "aria-setsize",
      "3",
    );
    // Focus stays on the group's header.
    expect(await activeCell(page)).toBe("rowheader:Americas");
    await expect(root.locator("[aria-live=polite]")).toHaveText(
      /Americas expanded, 7 rows/,
    );
    await page.keyboard.press("Shift+ArrowLeft");
    await expect(table.getByRole("rowheader")).toHaveCount(4);
    await page.keyboard.press("Shift+ArrowRight");
    await expect(table.getByRole("rowheader")).toHaveCount(7);
    await table.getByRole("rowheader", { name: "Asia" }).click();
    await expect(root.getByTestId("expanded")).toHaveText("2");
    await expect(root.getByTestId("toggles")).toContainText("Asia:true");
    await root.getByRole("button", { name: "Collapse all" }).click();
    await expect(table.getByRole("rowheader")).toHaveCount(4);
    await root.getByRole("button", { name: "Expand all" }).click();
    await expect(table.getByRole("rowheader")).toHaveCount(13);
  });

  test("expands a column group and keeps its subtotal", async ({ page }) => {
    await page.goto("/pivot-table.html");
    const table = grid(page, "multi");
    await table
      .getByRole("columnheader", { name: "2024", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(
      table.getByRole("columnheader", { name: "2024 total" }),
    ).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Q1" })).toHaveCount(
      1,
    );
    await page.keyboard.press("ArrowDown");
    expect(await activeCell(page)).toMatch(/^columnheader:Q1/);
  });

  test("lists the records behind a cell and returns focus", async ({
    page,
  }) => {
    await page.goto("/pivot-table.html");
    const root = page.getByTestId("basic");
    const table = grid(page, "basic");
    const cell = table.getByRole("gridcell", { name: "$879,805" });
    await cell.focus();
    await page.keyboard.press("Enter");
    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("table", { name: "Records" })).toBeVisible();
    await expect(root.getByTestId("drilled")).toHaveText(
      /^Americas\|2023\|\d+$/,
    );
    const count = Number(
      (await root.getByTestId("drilled").textContent())?.split("|")[2],
    );
    await expect(panel.locator("tbody tr")).toHaveCount(Math.min(count, 200));
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(cell).toBeFocused();
  });

  test("exports the visible pivot as CSV", async ({ page }) => {
    await page.goto("/pivot-table.html");
    const root = page.getByTestId("basic");
    await root.getByRole("rowheader", { name: "Americas" }).click();
    const download = page.waitForEvent("download");
    await root.getByRole("button", { name: "Export CSV" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("pivot.csv");
    const stream = await file.createReadStream();
    let text = "";
    for await (const chunk of stream) text += chunk;
    const lines = text.split("\r\n");
    expect(lines[0]).toBe("Region,Country,2023,2024,2025,Grand total");
    expect(lines[1].startsWith("Americas,,")).toBe(true);
    expect(lines[2].startsWith(",Brazil,")).toBe(true);
    expect(lines.at(-1)?.startsWith("Grand total,,")).toBe(true);
  });

  test("keeps the headers and first column in view while scrolling", async ({
    page,
  }) => {
    await page.goto("/pivot-table.html");
    const scroll = page.getByTestId("wide").locator(".bx--pivot-table__scroll");
    await scroll.evaluate((el) => {
      el.scrollLeft = 600;
    });
    const header = scroll.locator("thead th").nth(1);
    const rowHeader = scroll.locator("tbody td").first();
    const box = await scroll.boundingBox();
    const [h, r] = await Promise.all([
      header.boundingBox(),
      rowHeader.boundingBox(),
    ]);
    expect(r?.x).toBeCloseTo(box?.x ?? 0, 0);
    expect(h?.y).toBeCloseTo(box?.y ?? 0, 0);
    // The corner stays at the top start.
    const corner = await scroll.locator("thead th").first().boundingBox();
    expect(corner?.x).toBeCloseTo(box?.x ?? 0, 0);
    expect(corner?.y).toBeCloseTo(box?.y ?? 0, 0);
  });

  test("scrolls a focused cell clear of the sticky header and column", async ({
    page,
  }) => {
    await page.goto("/pivot-table.html");
    const table = grid(page, "wide");
    const scroll = page.getByTestId("wide").locator(".bx--pivot-table__scroll");
    await table.getByRole("rowheader", { name: "Team 1" }).focus();
    await press(page, "ArrowRight", 12);
    await expectClearOfPins(scroll, table.locator(":focus"));
    await press(page, "ArrowLeft", 11);
    await expectClearOfPins(scroll, table.locator(":focus"));
    await page.keyboard.press("Control+End");
    await expectClearOfPins(scroll, table.locator(":focus"));
    await page.keyboard.press("PageUp");
    await expectClearOfPins(scroll, table.locator(":focus"));
  });

  test("renders the deepest nesting indented", async ({ page }) => {
    await page.goto("/pivot-table.html");
    const table = grid(page, "deep");
    const levels = await table
      .locator("tbody tr")
      .evaluateAll((rows) => rows.map((r) => r.getAttribute("aria-level")));
    expect(new Set(levels)).toEqual(new Set(["1", "2", "3", "4"]));
    const x = async (level: string) =>
      (
        await table
          .locator(
            `tbody tr[aria-level="${level}"] .bx--pivot-table__label > :first-child`,
          )
          .first()
          .boundingBox()
      )?.x ?? 0;
    expect(await x("2")).toBeGreaterThan(await x("1"));
    expect(await x("4")).toBeGreaterThan(await x("3"));
  });

  for (const [name, setup] of [
    ["White", async () => {}],
    [
      "Gray 100",
      async (page: Page) => {
        await page.evaluate(() =>
          document.documentElement.classList.add("bx--g100"),
        );
      },
    ],
    [
      "RTL",
      async (page: Page) => {
        await page.evaluate(() =>
          document.documentElement.setAttribute("dir", "rtl"),
        );
      },
    ],
  ] as const) {
    test(`has no axe violations in ${name}`, async ({ page }) => {
      await page.goto("/pivot-table.html");
      await setup(page);
      await expect(grid(page, "basic")).toBeVisible();
      const collapsed = await new AxeBuilder({ page })
        .include("#app")
        .analyze();
      expect(collapsed.violations).toEqual([]);
      await page
        .getByTestId("basic")
        .getByRole("button", { name: "Expand all" })
        .click();
      await grid(page, "basic").getByRole("gridcell").nth(1).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      // The fixture page has no landmarks, which only the page-wide rule needs.
      const open = await new AxeBuilder({ page })
        .disableRules(["region"])
        .analyze();
      expect(open.violations).toEqual([]);
    });
  }

  test("moves by the inline direction in RTL", async ({ page }) => {
    await page.goto("/pivot-table.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const table = grid(page, "basic");
    const first = table.getByRole("rowheader", { name: "Americas" });
    await first.focus();
    await page.keyboard.press("ArrowLeft");
    expect(await activeCell(page)).toBe("gridcell:$879,805");
    await page.keyboard.press("ArrowRight");
    expect(await activeCell(page)).toBe("rowheader:Americas");
    await page.keyboard.press("Shift+ArrowLeft");
    await expect(table.getByRole("rowheader")).toHaveCount(7);
    // The first column sits at the right edge.
    const [t, c] = await Promise.all([
      table.boundingBox(),
      first.boundingBox(),
    ]);
    expect((c?.x ?? 0) + (c?.width ?? 0)).toBeCloseTo(
      (t?.x ?? 0) + (t?.width ?? 0),
      0,
    );
  });

  test("draws one focus ring and keeps totals distinct in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/pivot-table.html");
    const table = grid(page, "basic");
    await table.getByRole("gridcell").first().focus();
    await expectSingleRing([table]);
    const ring = await table.locator(":focus").evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        style: s.outlineStyle,
        width: Number.parseFloat(s.outlineWidth),
      };
    });
    expect(ring.style).not.toBe("none");
    expect(ring.width).toBeGreaterThanOrEqual(2);
    const border = await table
      .locator("tbody tr")
      .last()
      .locator("td")
      .nth(1)
      .evaluate((el) => getComputedStyle(el).borderTopStyle);
    expect(border).toBe("solid");
  });
});

test.describe("PivotFieldList", () => {
  const zone = (page: Page, name: string) =>
    page.getByTestId("builder").locator(`[data-pivot-zone="${name}"]`);
  const chip = (page: Page, name: string, field: string) =>
    zone(page, name).locator(`[data-pivot-field="${field}"]`);

  test("drags a field to another area and into place", async ({ page }) => {
    await page.goto("/pivot-table.html");
    const country = chip(page, "available", "country");
    const rows = zone(page, "rows");
    // Mouse coordinates are the viewport's, so bring the list into it.
    await page.getByTestId("builder").scrollIntoViewIfNeeded();
    const first = chip(page, "rows", "region");
    const target = (await first.boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const from = (await country.boundingBox()) as typeof target;
    await page.mouse.move(from.x + 20, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + 60, from.y + from.height / 2, { steps: 3 });
    await page.mouse.move(target.x + 30, target.y + 2, { steps: 5 });
    await expect(rows).toHaveClass(/bx--pivot-fields__zone--over/);
    await expect(page.locator(".bx--pivot-fields__ghost")).toHaveText(
      "Country",
    );
    await page.mouse.up();
    // Dropped above Region, so Country is the outer row field.
    await expect(rows.locator(".bx--pivot-fields__text")).toHaveText([
      "Country",
      "Region",
    ]);
    await expect(
      zone(page, "available").locator(".bx--pivot-fields__text"),
    ).not.toContainText(["Country"]);
    await expect(page.getByTestId("moves")).toHaveText(
      "country:available>rows;",
    );
    await expect(
      grid(page, "builder").getByRole("columnheader").first(),
    ).toHaveText("Country / Region");
    await expect(page.locator(".bx--pivot-fields__ghost")).toHaveCount(0);
  });

  test("a press on the menu button is a click, not a drag", async ({
    page,
  }) => {
    await page.goto("/pivot-table.html");
    await chip(page, "rows", "region").getByRole("button").click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByTestId("moves")).toHaveText("");
  });

  test("moves a field by its menu, with the keyboard", async ({ page }) => {
    await page.goto("/pivot-table.html");
    await chip(page, "available", "product").getByRole("button").focus();
    await page.keyboard.press("Enter");
    await page
      .getByRole("menuitem", { name: "Move to Columns" })
      .press("Enter");
    await expect(
      zone(page, "columns").locator(".bx--pivot-fields__text"),
    ).toHaveText(["Year", "Product"]);
    // Focus follows the field to its new area.
    await expect(
      chip(page, "columns", "product").getByRole("button"),
    ).toBeFocused();
    await expect(
      page.getByTestId("builder").locator("[aria-live=polite]").first(),
    ).toHaveText("Product moved to Columns");
    await chip(page, "columns", "product").getByRole("button").press("Enter");
    await page.getByRole("menuitem", { name: "Move up" }).press("Enter");
    await expect(
      zone(page, "columns").locator(".bx--pivot-fields__text"),
    ).toHaveText(["Product", "Year"]);
    await chip(page, "columns", "product").getByRole("button").press("Enter");
    await page.getByRole("menuitem", { name: "Remove" }).press("Enter");
    await expect(
      zone(page, "columns").locator(".bx--pivot-fields__text"),
    ).toHaveText(["Year"]);
  });

  test("changes an aggregate and filters values from the menus", async ({
    page,
  }) => {
    await page.goto("/pivot-table.html");
    const built = grid(page, "builder");
    await chip(page, "values", "amount").getByRole("button").click();
    await page.getByRole("menuitem", { name: "Summarize by" }).click();
    await page
      .getByRole("menuitemcheckbox", { name: "Count", exact: true })
      .click();
    await expect(chip(page, "values", "amount")).toContainText(
      "Count of Amount",
    );
    await page.keyboard.press("Escape");
    await expect(built.getByRole("gridcell").first()).not.toHaveText("879,805");

    await chip(page, "available", "channel").getByRole("button").click();
    await page.getByRole("menuitem", { name: "Move to Filters" }).click();
    await chip(page, "filters", "channel").getByRole("button").click();
    await page.getByRole("menuitem", { name: "Show values" }).click();
    const before = await built
      .getByRole("row")
      .last()
      .getByRole("gridcell")
      .last()
      .textContent();
    await page.getByRole("menuitemcheckbox", { name: "Partner" }).click();
    await page.keyboard.press("Escape");
    await expect(
      built.getByRole("row").last().getByRole("gridcell").last(),
    ).not.toHaveText(before ?? "");
  });

  test("has no axe violations", async ({ page }) => {
    await page.goto("/pivot-table.html");
    await chip(page, "available", "country").getByRole("button").click();
    await expect(page.getByRole("menu")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .include("[data-testid=builder]")
      .include(".bx--menu")
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
