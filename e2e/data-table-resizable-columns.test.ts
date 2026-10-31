import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { expectTextFits } from "./helpers/layout";

async function open(page: Page, query = "") {
  await page.goto(`/data-table-resizable-columns.html?${query}`);
  await expect(page.locator("tbody tr").first()).toBeVisible();
}

/** Width of each header cell, in order. */
function widths(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("thead th")].map(
      (th) => th.getBoundingClientRect().width,
    ),
  );
}

async function center(handle: Locator) {
  const box = await handle.boundingBox();
  if (!box) throw new Error("handle has no box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test.describe("DataTable resizable columns", () => {
  test("ends a cut header label in an ellipsis, with the full label as a title", async ({
    page,
  }) => {
    await open(page, "rows=2");
    // Home takes "Environment" to the 48px minimum, narrower than its label.
    await page.getByRole("separator").last().focus();
    await page.keyboard.press("Home");
    const label = page.locator("thead .bx--table-header-label").last();

    await expect(label).toHaveCSS("text-overflow", "ellipsis");
    await expectTextFits(page.locator("thead"));
    await label.hover();
    await expect(label).toHaveAttribute("title", "Environment");
  });

  test("scrolls a narrow container instead of squeezing unsized columns", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await open(page, "rows=2");

    await expectTextFits(page.getByTestId("resizable-root"));
    const [table, root] = await Promise.all([
      page.locator("table").boundingBox(),
      page.getByTestId("resizable-root").boundingBox(),
    ]);
    expect(table?.width).toBeGreaterThan(root?.width ?? 0);
  });

  test("tracks the pointer one to one and moves only the columns after it", async ({
    page,
  }) => {
    await open(page);
    const [name, region, service] = await widths(page);
    const { x, y } = await center(page.getByRole("separator").first());

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 20, y);
    await expect
      .poll(async () => (await widths(page))[0])
      .toBeCloseTo(name + 20, 0);
    await page.mouse.move(x + 55, y);
    await expect
      .poll(async () => (await widths(page))[0])
      .toBeCloseTo(name + 55, 0);
    await page.mouse.move(x + 90, y);
    await expect
      .poll(async () => (await widths(page))[0])
      .toBeCloseTo(name + 90, 0);
    const during = await widths(page);
    await page.mouse.up();

    // The columns after the dragged one keep their own widths.
    expect(during.slice(1, 3)).toEqual([region, service]);
    expect((await widths(page))[0]).toBeCloseTo(name + 90, 0);
    await expect(page.getByTestId("resize-log")).toContainText('"width":');
    expect(
      JSON.parse((await page.getByTestId("resize-log").textContent()) ?? "[]"),
    ).toHaveLength(1);
  });

  test("keeps the layout the table already had when the first drag starts", async ({
    page,
  }) => {
    await open(page);
    const before = await widths(page);
    const { x, y } = await center(page.getByRole("separator").nth(1));

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 1, y);
    await page.mouse.move(x, y);
    await page.mouse.up();

    // Pressing a handle freezes widths without moving anything.
    const after = await widths(page);
    for (const [i, width] of before.entries()) {
      expect(after[i]).toBeCloseTo(width, 0);
    }
  });

  test("does not sort when a drag ends over a sort button", async ({
    page,
  }) => {
    await open(page, "sortable");
    const { x, y } = await center(page.getByRole("separator").first());

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 120, y);
    await page.mouse.up();

    await expect(page.getByTestId("header-clicks")).toHaveText("0");
    await expect(
      page.locator("thead th[aria-sort]:not([aria-sort=none])"),
    ).toHaveCount(0);
  });

  test("resizes from the keyboard and reports the value", async ({ page }) => {
    await open(page);
    const handle = page.getByRole("separator").first();
    const [name] = await widths(page);

    await handle.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");

    await expect(handle).toHaveAttribute(
      "aria-valuenow",
      `${Math.round(name) + 50}`,
    );
    expect((await widths(page))[0]).toBeCloseTo(name + 50, 0);
  });

  test("starts from a saved layout without a flash", async ({ page }) => {
    await open(page, "seed");

    expect((await widths(page)).map(Math.round)).toEqual([
      200, 120, 240, 140, 160,
    ]);
  });

  test("restores a declared width on double click", async ({ page }) => {
    await open(page);
    const handle = page.getByRole("separator").nth(2);
    const { x, y } = await center(handle);

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 40, y);
    await page.mouse.up();
    expect((await widths(page))[2]).toBeCloseTo(220, 0);

    await handle.dblclick();

    expect((await widths(page))[2]).toBeCloseTo(180, 0);
  });

  test("keeps the handle inside its header", async ({ page }) => {
    await open(page);

    const inside = await page.evaluate(() =>
      [...document.querySelectorAll("thead th")].map((th) => {
        const handle = th.querySelector("[role=separator]");
        if (!handle) return null;
        const cell = th.getBoundingClientRect();
        const box = handle.getBoundingClientRect();
        return box.left >= cell.left - 0.5 && box.right <= cell.right + 0.5;
      }),
    );

    expect(inside).toEqual([true, true, true, null, true]);
  });

  for (const size of ["compact", "short", "medium", "tall"]) {
    test(`spans the height of a ${size} header`, async ({ page }) => {
      await open(page, `size=${size}&sortable`);

      const { handle, cell } = await page.evaluate(() => {
        const th = document.querySelector("thead th") as HTMLElement;
        return {
          handle: th.querySelector("[role=separator]")?.getBoundingClientRect()
            .height,
          cell: th.getBoundingClientRect().height,
        };
      });

      // Collapsed borders leave up to half a pixel of the cell outside it.
      expect(Math.abs((handle ?? 0) - cell)).toBeLessThan(1);
    });
  }

  test("resizes under a sticky header, and with selection and expansion", async ({
    page,
  }) => {
    await open(page, "stickyHeader&batch&expandable&rows=30");
    const handle = page.getByRole("separator").first();
    const { x, y } = await center(handle);
    const [, , name] = await widths(page);

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 50, y);
    await page.mouse.up();

    expect((await widths(page))[2]).toBeCloseTo(name + 50, 0);
  });

  test("drags the other way under rtl", async ({ page }) => {
    await open(page, "rtl");
    const [name] = await widths(page);
    const handle = page.getByRole("separator").first();
    const { x, y } = await center(handle);

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 40, y);
    await page.mouse.up();

    expect((await widths(page))[0]).toBeCloseTo(name + 40, 0);

    await handle.focus();
    await page.keyboard.press("ArrowRight");
    // ArrowRight moves the handle toward the inline end, which is the left.
    expect((await widths(page))[0]).toBeCloseTo(name + 30, 0);
  });

  test("draws the handle in system colors in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);
    const handle = page.getByRole("separator").first();

    const colors = await page.evaluate(() => {
      const probe = document.createElement("div");
      document.body.append(probe);
      const color = (name: string) => {
        probe.style.backgroundColor = name;
        return getComputedStyle(probe).backgroundColor;
      };
      const colors = {
        buttonText: color("ButtonText"),
        highlight: color("Highlight"),
      };
      probe.remove();
      return colors;
    });
    const line = () =>
      handle.evaluate((el) => getComputedStyle(el, "::after").backgroundColor);

    expect(await line()).toBe(colors.buttonText);
    // The line takes the hover color once the pointer has rested on it.
    await handle.hover();
    await expect.poll(line).toBe(colors.highlight);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await open(page, "sortable&batch");
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
