import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** Where the row that reads `text` sits against the top of `list`, or null when it is not rendered. */
function readRow(list: Locator, text: string) {
  return list.evaluate((el, text) => {
    const box = el.getBoundingClientRect();
    const row = Array.from(
      el.querySelectorAll("[data-virtual-row], .row"),
    ).find((candidate) => candidate.textContent?.trim() === text);
    if (!row) return null;
    const rect = row.getBoundingClientRect();
    return {
      top: rect.top - box.top,
      bottom: rect.bottom - box.top,
      height: box.height,
    };
  }, text);
}

/**
 * Sample where the row that reads `text` sits against the top of `list` on
 * every frame, for `frames` frames. Start it before the action it watches.
 */
function sampleRow(list: Locator, text: string, frames: number) {
  return list.evaluate(
    (el, { text, frames }) =>
      new Promise<Array<number | null>>((resolve) => {
        const samples: Array<number | null> = [];
        const tick = () => {
          const box = el.getBoundingClientRect();
          const row = Array.from(el.querySelectorAll(".row")).find(
            (candidate) => candidate.textContent?.trim() === text,
          );
          samples.push(row ? row.getBoundingClientRect().top - box.top : null);
          if (samples.length < frames) requestAnimationFrame(tick);
          else resolve(samples);
        };
        requestAnimationFrame(tick);
      }),
    { text, frames },
  );
}

/** The first row that starts inside `list`, with where it sits. */
function readFirstRow(list: Locator) {
  return list.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const row = Array.from(el.querySelectorAll(".row")).find(
      (candidate) => candidate.getBoundingClientRect().top >= box.top - 0.5,
    );
    if (!row) throw new Error("no row in view");
    return {
      text: row.textContent?.trim() ?? "",
      top: row.getBoundingClientRect().top - box.top,
    };
  });
}

async function scrollListTo(list: Locator, top: number) {
  await list.evaluate((el, top) => {
    el.scrollTop = top;
  }, top);
  // Let the scroll handler render the window.
  await list.page().waitForTimeout(120);
}

/** Wait until nothing moves the list for a while: measured rows arrive for a few frames after a scroll. */
async function settle(list: Locator) {
  let still = 0;
  let last = Number.NaN;
  while (still < 6) {
    await list.page().waitForTimeout(50);
    const next = await list.evaluate((el) => {
      const row = el.querySelector(".row");
      return el.scrollTop + (row ? row.getBoundingClientRect().top : 0);
    });
    still = next === last ? still + 1 : 0;
    last = next;
  }
}

async function openOps(page: Page) {
  await page.goto("/virtual-list-ops.html");
  await expect(page.getByTestId("jump-list")).toBeVisible();
}

test.describe("VirtualList scrollToIndex", () => {
  test("aligns the row to the start, center and end of the viewport", async ({
    page,
  }) => {
    await openOps(page);
    const list = page.getByTestId("jump-list");
    const align = page.getByTestId("jump-align");

    await align.selectOption("start");
    await page.getByTestId("jump").click();
    await expect
      .poll(async () => (await readRow(list, "Row 5000"))?.top, {
        timeout: 15_000,
      })
      .toBeCloseTo(0, 0);

    await align.selectOption("center");
    await page.getByTestId("jump-index").fill("20000");
    await page.getByTestId("jump").click();
    await expect
      .poll(async () => {
        const row = await readRow(list, "Row 20000");
        return row && (row.top + row.bottom) / 2 - row.height / 2;
      })
      .toBeCloseTo(0, 0);

    await align.selectOption("end");
    await page.getByTestId("jump-index").fill("99999");
    await page.getByTestId("jump").click();
    await expect
      .poll(async () => {
        const row = await readRow(list, "Row 99999");
        return row && row.bottom - row.height;
      })
      .toBeCloseTo(0, 0);
  });

  test("moves only as far as the nearest edge asks", async ({ page }) => {
    await openOps(page);
    const list = page.getByTestId("jump-list");
    await page.getByTestId("jump").click();
    await expect
      .poll(async () => (await readRow(list, "Row 5000"))?.top, {
        timeout: 15_000,
      })
      .toBeCloseTo(0, 0);

    const align = page.getByTestId("jump-align");
    await align.selectOption("nearest");

    // In view already: the list stays where it is.
    await page.getByTestId("jump-index").fill("5003");
    const before = await list.evaluate((el) => el.scrollTop);
    await page.getByTestId("jump").click();
    await page.waitForTimeout(150);
    expect(await list.evaluate((el) => el.scrollTop)).toBe(before);

    // Below the viewport: the row's end meets the viewport's end.
    await page.getByTestId("jump-index").fill("5100");
    await page.getByTestId("jump").click();
    await expect
      .poll(async () => {
        const row = await readRow(list, "Row 5100");
        return row && row.bottom - row.height;
      })
      .toBeCloseTo(0, 0);
  });
});

test.describe("VirtualList prepend", () => {
  for (const [name, listId, buttonId, anchorTop] of [
    ["fixed rows", "feed-list", "older", 24 * 1000],
    ["measured rows", "measured-feed-list", "older-measured", 24 * 1500],
  ] as const) {
    test(`holds the place of the reader mid-list, ${name}`, async ({
      page,
    }) => {
      await openOps(page);
      const list = page.getByTestId(listId);
      await scrollListTo(list, anchorTop);
      await settle(list);
      // A row that has scrolled halfway out of view anchors by what is above it.
      const anchor = await readFirstRow(list);

      const sampling = sampleRow(list, anchor.text, 40);
      await page.getByTestId(buttonId).click();
      const samples = await sampling;

      // No frame shows the row anywhere but where it was.
      const moved = samples.filter(
        (top) => top === null || Math.abs(top - anchor.top) > 1,
      );
      expect(moved, `positions of ${anchor.text}: ${samples}`).toEqual([]);

      // The rows that arrived are above, waiting to be scrolled to.
      await scrollListTo(list, 0);
      expect((await readFirstRow(list)).text).toBe("Row 950");
    });
  }

  test("leaves the top alone, so new rows at the top come into view", async ({
    page,
  }) => {
    await openOps(page);
    const list = page.getByTestId("feed-list");
    await expect
      .poll(async () => (await readFirstRow(list)).text)
      .toBe("Row 1000");

    await page.getByTestId("older").click();

    await expect
      .poll(async () => (await readFirstRow(list)).text)
      .toBe("Row 950");
  });
});

test.describe("VirtualList follow", () => {
  test("keeps the newest row in view while 50 rows a second arrive", async ({
    page,
  }) => {
    await openOps(page);
    const list = page.getByTestId("log-list");
    await expect(page.getByTestId("at-end")).toHaveText("at end");

    const frames = list.evaluate(
      (el) =>
        new Promise<number[]>((resolve) => {
          const gaps: number[] = [];
          const start = performance.now();
          const tick = () => {
            const box = el.getBoundingClientRect();
            const rows = Array.from(el.querySelectorAll(".row"));
            // The newest row is the last one the window holds.
            const last = rows[rows.length - 1];
            if (last)
              gaps.push(box.bottom - last.getBoundingClientRect().bottom);
            if (performance.now() - start < 3000) requestAnimationFrame(tick);
            else resolve(gaps);
          };
          requestAnimationFrame(tick);
        }),
    );
    await page.getByTestId("stream").click();
    const gaps = await frames;
    await page.getByTestId("stop-stream").click();

    // The window runs a few rows past the viewport, never short of it: no
    // frame leaves blank space under the newest row.
    expect(gaps.length).toBeGreaterThan(100);
    expect(gaps.filter((gap) => gap > 1)).toEqual([]);

    // And the newest row is the one in view.
    await expect(page.getByTestId("at-end")).toHaveText("at end");
    const count = await list.evaluate((el) => {
      const rows = el.querySelectorAll(".row");
      return Number(rows[rows.length - 1].textContent?.replace("Row ", ""));
    });
    expect(count).toBeGreaterThan(200);
    await expect
      .poll(async () => {
        const row = await readRow(list, `Row ${count}`);
        return row && row.height - row.bottom;
      })
      .toBeCloseTo(0, 0);
  });

  test("lets go when the reader scrolls up, and takes hold again on request", async ({
    page,
  }) => {
    await openOps(page);
    const list = page.getByTestId("log-list");
    await page.getByTestId("stream").click();
    await page.waitForTimeout(600);

    await list.hover();
    await page.mouse.wheel(0, -400);
    await expect(page.getByTestId("at-end")).toHaveText("behind");
    // A wheel scroll can run on after the input that began it.
    await settle(list);
    const held = await list.evaluate((el) => el.scrollTop);

    // Rows go on arriving; the reader's place does not move.
    await page.waitForTimeout(600);
    expect(
      Math.abs((await list.evaluate((el) => el.scrollTop)) - held),
    ).toBeLessThan(2);

    await page.getByTestId("jump-to-end").click();
    await expect(page.getByTestId("at-end")).toHaveText("at end");
    await page.waitForTimeout(300);
    const gap = await list.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const rows = el.querySelectorAll(".row");
      return box.bottom - rows[rows.length - 1].getBoundingClientRect().bottom;
    });
    expect(gap).toBeLessThanOrEqual(1);
    await page.getByTestId("stop-stream").click();
  });
});

test.describe("VirtualList dropped rows", () => {
  test("holds the place of a reader who has scrolled back when the oldest rows are dropped", async ({
    page,
  }) => {
    await openOps(page);
    const list = page.getByTestId("log-list");
    await page.getByTestId("stream").click();
    await page.waitForTimeout(1500);
    await page.getByTestId("stop-stream").click();

    await list.hover();
    await page.mouse.wheel(0, -800);
    await expect(page.getByTestId("at-end")).toHaveText("behind");
    await settle(list);
    const anchor = await readFirstRow(list);

    const sampling = sampleRow(list, anchor.text, 30);
    await page.getByTestId("trim").click();
    const samples = await sampling;

    expect(
      samples.filter((top) => top === null || Math.abs(top - anchor.top) > 1),
      `positions of ${anchor.text}: ${samples}`,
    ).toEqual([]);
  });
});

test.describe("VirtualList keepMounted", () => {
  test("keeps the active option mounted through keys faster than frames", async ({
    page,
  }) => {
    await page.goto("/virtual-list-listbox.html");
    const listbox = page.getByTestId("listbox");
    await listbox.focus();

    const activeIsMounted = () =>
      listbox.evaluate((el) => {
        const id = el.getAttribute("aria-activedescendant");
        const option = id ? document.getElementById(id) : null;
        if (!option) return "missing";
        const box = el.getBoundingClientRect();
        const rect = option.getBoundingClientRect();
        return rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1
          ? "in view"
          : "out of view";
      });

    // Fifty keys with no wait between them: faster than a frame.
    for (let i = 0; i < 50; i++) await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("active")).toHaveText("50");
    await expect.poll(activeIsMounted).toBe("in view");

    await page.keyboard.press("End");
    await expect(page.getByTestId("active")).toHaveText("99999");
    await expect.poll(activeIsMounted).toBe("in view");

    for (let i = 0; i < 20; i++) await page.keyboard.press("PageUp");
    await expect.poll(activeIsMounted).toBe("in view");

    await page.keyboard.press("Home");
    await expect(page.getByTestId("active")).toHaveText("0");
    await expect.poll(activeIsMounted).toBe("in view");
  });

  test("keeps the active option after the window moves on without it", async ({
    page,
  }) => {
    await page.goto("/virtual-list-listbox.html");
    const listbox = page.getByTestId("listbox");
    await listbox.focus();
    for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowDown");
    const option = page.locator("#option-5");
    const handle = await option.elementHandle();

    // The reader scrolls a long way off with the wheel; no key moves the highlight.
    await scrollListTo(listbox, 32 * 50_000);

    // The element that held the highlight is still in the page, and still the one
    // the listbox names.
    expect(await listbox.getAttribute("aria-activedescendant")).toBe(
      "option-5",
    );
    expect(await handle?.evaluate((el) => el.isConnected)).toBe(true);
    await expect(option).toHaveCount(1);
    await expect(page.locator("#option-50000")).toHaveCount(1);
  });

  test("has no axe violations", async ({ page }) => {
    await page.goto("/virtual-list-listbox.html");
    await page.getByTestId("listbox").focus();
    for (let i = 0; i < 40; i++) await page.keyboard.press("ArrowDown");
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("VirtualList stickyIndices", () => {
  test("pins the header of the section in view, once", async ({ page }) => {
    await page.goto("/virtualizer-sections.html");
    const list = page.getByTestId("sections");

    for (const section of [0, 7, 120]) {
      // A third of the way into the section, away from its header.
      const top = 32 * (section * 501 + 170);
      await scrollListTo(list, top);

      const rows = await list.evaluate((el) => {
        const box = el.getBoundingClientRect();
        return Array.from(el.querySelectorAll(".row"))
          .filter((row) => row.classList.contains("header"))
          .map((row) => ({
            text: row.textContent?.trim(),
            top: Math.round(row.getBoundingClientRect().top - box.top),
          }));
      });

      expect(rows).toEqual([{ text: `Section ${section}`, top: 0 }]);
    }
  });

  test("hands the top to the next header as it arrives", async ({ page }) => {
    await page.goto("/virtualizer-sections.html");
    const list = page.getByTestId("sections");
    const pinned = () =>
      list.evaluate((el) => {
        const box = el.getBoundingClientRect();
        return Array.from(el.querySelectorAll(".header"))
          .filter(
            (row) => Math.abs(row.getBoundingClientRect().top - box.top) < 1,
          )
          .map((row) => row.textContent?.trim());
      });

    // The last row of section 3 sits at the viewport's start, under its header.
    await scrollListTo(list, 32 * (4 * 501 - 1));
    expect(await pinned()).toEqual(["Section 3"]);

    // Section 4's header is the next row, and takes the top.
    await scrollListTo(list, 32 * (4 * 501));
    expect(await pinned()).toEqual(["Section 4"]);
  });
});

test.describe("A list taller than a browser scrolls", () => {
  test("reaches the end of 1,000,000 rows", async ({ page }) => {
    await openOps(page);
    await page.getByTestId("load-huge").click();
    const list = page.getByTestId("huge-list");
    await expect(list).toBeVisible();

    await page.getByTestId("huge-to-end").click();
    // A browser that drops a taller spacer leaves the list on its first rows.
    await expect
      .poll(async () => {
        const first = await readFirstRow(list);
        return Number(first.text.replace("Row ", ""));
      })
      .toBeGreaterThan(500_000);
  });
});

test.describe("Grid virtualizer", () => {
  function readCell(page: Page, cell: string) {
    return page.getByTestId("body").evaluate((el, cell) => {
      const box = el.getBoundingClientRect();
      const node = el.querySelector(`[data-cell="${cell}"]`);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left - box.left,
        right: box.right - rect.right,
        top: rect.top - box.top,
        width: box.width,
        height: box.height,
        cells: el.querySelectorAll("[data-cell]").length,
      };
    }, cell);
  }

  for (const direction of ["ltr", "rtl"] as const) {
    test(`windows a million cells and scrolls to one, ${direction}`, async ({
      page,
    }) => {
      await page.goto("/virtualizer-grid.html");
      await page.evaluate((direction) => {
        document.documentElement.dir = direction;
      }, direction);
      await expect(page.getByTestId("body")).toBeVisible();

      // The first cell sits at the start of the inline axis.
      const start = await readCell(page, "0,0");
      expect(start).not.toBeNull();
      if (direction === "ltr") expect(start?.left).toBeCloseTo(0, 0);
      else expect(start?.right).toBeCloseTo(0, 0);

      await page.getByTestId("to-cell").click();
      await expect
        .poll(async () => {
          const cell = await readCell(page, "500,700");
          return cell && cell.left - (cell.width - 96) / 2;
        })
        .toBeCloseTo(0, 0);
      const cell = await readCell(page, "500,700");
      expect(cell && cell.top - (cell.height - 32) / 2).toBeCloseTo(0, 0);
      // 10 rows of 5 columns of 1,000,000 cells.
      expect(cell?.cells).toBeLessThan(120);

      // The header followed the body along the inline axis.
      const body = await page
        .getByTestId("body")
        .evaluate((el) => el.scrollLeft);
      expect(Math.abs(body)).toBeGreaterThan(60_000);
      await expect
        .poll(() => page.getByTestId("header").evaluate((el) => el.scrollLeft))
        .toBe(body);
    });
  }

  test("has no axe violations", async ({ page }) => {
    await page.goto("/virtualizer-grid.html");
    await page.getByTestId("to-cell").click();
    await expect(page.locator('[data-cell="500,700"]')).toBeVisible();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("renders ahead of a diagonal scroll", async ({ page }) => {
    await page.goto("/virtualizer-grid.html");
    const body = page.getByTestId("body");
    await body.hover();
    await page.mouse.wheel(300, 300);
    await page.waitForTimeout(150);
    // A cell past the viewport's end on both axes is already there.
    const ahead = await body.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return Array.from(el.querySelectorAll("[data-cell]")).some((cell) => {
        const rect = cell.getBoundingClientRect();
        return rect.left > box.right && rect.top > box.bottom;
      });
    });
    expect(ahead).toBe(true);
  });
});
