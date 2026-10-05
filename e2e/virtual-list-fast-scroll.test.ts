import { expect, type Locator, type Page, test } from "@playwright/test";

declare global {
  interface Window {
    /** Blank space left in the viewport on each scroll event, in pixels. */
    scrollGaps: number[];
  }
}

/**
 * Record, on every scroll event and before the list renders it, how much of
 * the viewport the rows already rendered leave uncovered. The browser can
 * paint that scroll position before the list catches up, so this is the blank
 * space a fast scroll would flash.
 */
async function recordGaps(list: Locator) {
  await list.evaluate((el) => {
    const gaps: number[] = [];
    window.scrollGaps = gaps;
    document.addEventListener(
      "scroll",
      (event) => {
        if (event.target !== el) return;
        const rows = el.querySelectorAll(".row");
        const box = el.getBoundingClientRect();
        const top = rows[0].getBoundingClientRect().top - box.top;
        const bottom =
          rows[rows.length - 1].getBoundingClientRect().bottom - box.top;
        gaps.push(Math.max(0, top) + Math.max(0, el.clientHeight - bottom));
      },
      true,
    );
  });
}

async function flick(page: Page, list: Locator, delta: number, count = 20) {
  const box = await list.boundingBox();
  if (!box) throw new Error("list has no box");
  await page.mouse.move(box.x + 20, box.y + 20);
  for (let i = 0; i < count; i++) {
    // biome-ignore lint/performance/noAwaitInLoops: each wheel is its own frame
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(150);
}

/** Each row in view, by its text and where it sits in the viewport. */
function readRowsInView(list: Locator) {
  return list.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return Array.from(el.querySelectorAll(".row"))
      .map((row) => {
        const rect = row.getBoundingClientRect();
        return {
          text: row.textContent?.trim() ?? "",
          top: Math.round(rect.top - box.top),
          bottom: Math.round(rect.bottom - box.top),
        };
      })
      .filter((row) => row.bottom > 0 && row.top < el.clientHeight);
  });
}

test.describe("VirtualList optimizeFastScroll", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/virtual-list-fast-scroll.html");
  });

  test("a scroll faster than the window shows rows, not blank space", async ({
    page,
  }) => {
    const plain = page.getByTestId("default");
    await recordGaps(plain);
    await flick(page, plain, 800);
    const defaultGaps: number[] = await page.evaluate(() => window.scrollGaps);
    // The control: past one viewport per frame, a default window falls behind.
    expect(defaultGaps.some((gap) => gap > 0)).toBe(true);

    const optimized = page.getByTestId("optimized");
    await recordGaps(optimized);
    await flick(page, optimized, 800);
    const optimizedGaps: number[] = await page.evaluate(
      () => window.scrollGaps,
    );
    expect(optimizedGaps.length).toBeGreaterThan(0);
    expect(optimizedGaps.every((gap) => gap < 1)).toBe(true);
  });

  test("rows sit where a default list puts them", async ({ page }) => {
    const plain = page.getByTestId("default");
    const optimized = page.getByTestId("optimized");

    for (const scrollTop of [0, 12_345, 1_000_000]) {
      for (const list of [plain, optimized]) {
        // biome-ignore lint/performance/noAwaitInLoops: positions settle per list
        await list.evaluate((el, top) => {
          el.scrollTop = top;
        }, scrollTop);
      }
      await page.waitForTimeout(100);

      expect(await readRowsInView(optimized)).toEqual(
        await readRowsInView(plain),
      );
    }

    // At the very end, the last row sits flush with the bottom edge.
    const rows = await readRowsInView(optimized);
    expect(rows.at(-1)).toEqual({ text: "Item 1999", top: 260, bottom: 300 });
  });

  test("scrolling a clipped row into view scrolls the list", async ({
    page,
  }) => {
    const optimized = page.getByTestId("optimized");

    const landed = await optimized.evaluate(async (el) => {
      const box = el.getBoundingClientRect();
      const below = Array.from(el.querySelectorAll(".row")).find(
        (row) => row.getBoundingClientRect().top >= box.bottom,
      );
      if (!below) return null;
      const text = below.textContent?.trim();
      below.scrollIntoView({ block: "nearest" });
      await new Promise((resolve) => setTimeout(resolve, 100));
      const row = Array.from(el.querySelectorAll(".row")).find(
        (candidate) => candidate.textContent?.trim() === text,
      );
      const rect = row?.getBoundingClientRect();
      const listBox = el.getBoundingClientRect();
      const layer = el.querySelector(":scope > div > div");
      return {
        listScrollTop: el.scrollTop,
        layerScrollTop: layer?.scrollTop,
        bottom: rect && Math.round(rect.bottom - listBox.top),
      };
    });

    expect(landed).toEqual({
      listScrollTop: 60,
      layerScrollTop: 0,
      bottom: 300,
    });
  });

  test("measured rows reach the end of the list", async ({ page }) => {
    const list = page.getByTestId("optimized-measured");

    // Scroll to the end until the measured height stops moving it.
    for (let pass = 0; pass < 10; pass++) {
      // biome-ignore lint/performance/noAwaitInLoops: each pass measures more rows
      await list.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await page.waitForTimeout(50);
    }

    const rows = await readRowsInView(list);
    expect(rows.at(-1)?.text).toBe("Item 1999");
    expect(rows.at(-1)?.bottom).toBe(300);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].top).toBe(rows[i - 1].bottom);
    }
  });

  test("rows wider than the list scroll sideways", async ({ page }) => {
    const list = page.getByTestId("optimized-wide");

    const scrolled = await list.evaluate((el) => {
      el.scrollLeft = 200;
      const row = el.querySelector(".row");
      return {
        scrollLeft: el.scrollLeft,
        rowLeft: row
          ? Math.round(
              row.getBoundingClientRect().left -
                el.getBoundingClientRect().left,
            )
          : null,
      };
    });

    expect(scrolled).toEqual({ scrollLeft: 200, rowLeft: -200 });
  });
});

test.describe("Dropdown optimizeFastScroll", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/virtual-list-fast-scroll.html");
    await page.getByRole("combobox").click();
    await expect(page.getByRole("listbox")).toBeVisible();
  });

  function highlightedInView(page: Page) {
    return page
      .locator(".bx--list-box__menu-item--highlighted")
      .evaluate((el) => {
        const menu = el.closest('[role="listbox"]');
        if (!menu) return null;
        const box = el.getBoundingClientRect();
        const menuBox = menu.getBoundingClientRect();
        return box.top >= menuBox.top - 1 && box.bottom <= menuBox.bottom + 1;
      });
  }

  test("keyboard jumps bring the highlighted option into view", async ({
    page,
  }) => {
    const field = page.getByRole("combobox");
    const highlighted = page.locator(".bx--list-box__menu-item--highlighted");

    await field.press("End");
    await expect(highlighted).toContainText("Item 1999");
    expect(await highlightedInView(page)).toBe(true);

    await field.press("PageUp");
    await expect(highlighted).toContainText("Item 1989");
    expect(await highlightedInView(page)).toBe(true);

    await field.press("Home");
    await expect(highlighted).toContainText("Item 0");
    expect(await highlightedInView(page)).toBe(true);

    for (let step = 0; step < 12; step++) {
      // biome-ignore lint/performance/noAwaitInLoops: each step lands before the next
      await field.press("ArrowDown");
      await page.waitForTimeout(60);
    }
    await expect(highlighted).toContainText("Item 12");
    expect(await highlightedInView(page)).toBe(true);
  });

  test("a fast scroll shows options, not blank space", async ({ page }) => {
    const menu = page.getByRole("listbox");
    await menu.evaluate((el) => {
      const gaps: number[] = [];
      window.scrollGaps = gaps;
      document.addEventListener(
        "scroll",
        (event) => {
          if (event.target !== el) return;
          const options = el.querySelectorAll('[role="option"]');
          const box = el.getBoundingClientRect();
          const top = options[0].getBoundingClientRect().top - box.top;
          const bottom =
            options[options.length - 1].getBoundingClientRect().bottom -
            box.top;
          gaps.push(Math.max(0, top) + Math.max(0, el.clientHeight - bottom));
        },
        true,
      );
    });

    await flick(page, menu, 800);
    const gaps: number[] = await page.evaluate(() => window.scrollGaps);
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.every((gap) => gap < 1)).toBe(true);
  });
});
