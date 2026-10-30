import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test as baseTest } from "@playwright/test";
import { expect, test } from "./helpers/host";

// The fixture shows the week of Oct 25, 2026 in Los Angeles, Sunday first,
// and scrolls the grid to 8 AM. Day 0 is Sunday.

async function planeBox(page: Page) {
  const box = await page.locator(".bx--scheduler__plane").boundingBox();
  if (!box) throw new Error("no plane");
  return box;
}

/** The pixel at the middle of `day`'s column, `minute` into the day. */
async function point(page: Page, day: number, minute: number, days = 7) {
  const box = await planeBox(page);
  return {
    x: box.x + (box.width * (day + 0.5)) / days,
    y: box.y + (box.height * minute) / 1440,
  };
}

async function drag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 6 });
  await page.mouse.up();
}

const lunch = (page: Page) => page.getByRole("button", { name: /^Lunch/ });

test.describe("Scheduler", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scheduler.html");
    await expect(lunch(page)).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("creates a slot from a click and a range from a drag", async ({
    page,
  }) => {
    const log = page.getByTestId("create-log");
    await page.mouse.click(
      ...(Object.values(await point(page, 3, 610)) as [number, number]),
    );
    await expect(log).toHaveText(
      "2026-10-28T17:00:00.000Z|2026-10-28T17:30:00.000Z|false|pointer",
    );
    await expect(page.getByTestId("selection")).toHaveText("selected");

    await drag(page, await point(page, 3, 600), await point(page, 3, 680));
    await expect(log).toHaveText(
      "2026-10-28T17:00:00.000Z|2026-10-28T18:30:00.000Z|false|pointer",
    );
  });

  test("drops the selection when create is canceled", async ({ page }) => {
    await page.getByTestId("cancel").check();
    const p = await point(page, 3, 610);
    await page.mouse.click(p.x, p.y);
    await expect(page.getByTestId("create-log")).not.toBeEmpty();
    await expect(page.getByTestId("selection")).toHaveText("none");
  });

  test("moves an event to another day and time", async ({ page }) => {
    await drag(page, await point(page, 2, 735), await point(page, 3, 855));
    await expect(page.getByTestId("change-log")).toHaveText(
      "lunch|move|2026-10-28T21:00:00.000Z|2026-10-28T22:00:00.000Z|pointer",
    );
    await expect(
      page.getByRole("button", { name: /^Lunch, 2:00 PM to 3:00 PM/ }),
    ).toBeVisible();
  });

  test("resizes an event from its bottom edge", async ({ page }) => {
    const box = await lunch(page).boundingBox();
    if (!box) throw new Error("no box");
    const grip = { x: box.x + box.width / 2, y: box.y + box.height - 3 };
    await drag(page, grip, await point(page, 2, 14 * 60));
    await expect(page.getByTestId("change-log")).toHaveText(
      "lunch|resize|2026-10-27T19:00:00.000Z|2026-10-27T21:00:00.000Z|pointer",
    );
  });

  test("leaves the event alone when change is canceled", async ({ page }) => {
    await page.getByTestId("cancel").check();
    await drag(page, await point(page, 2, 735), await point(page, 3, 855));
    await expect(page.getByTestId("change-log")).not.toBeEmpty();
    // The consumer's `preventDefault()` keeps the data as it was.
    await expect(lunch(page)).toHaveAttribute(
      "aria-label",
      /12:00 PM to 1:00 PM/,
    );
  });

  test("opens an event on a click without changing it", async ({ page }) => {
    await lunch(page).click();
    await expect(page.getByTestId("clicks")).toHaveText("1");
    await expect(page.getByTestId("change-log")).toBeEmpty();
  });

  test("does not edit a read-only event", async ({ page }) => {
    const locked = page.getByRole("button", { name: /^Locked/ });
    const box = await locked.boundingBox();
    if (!box) throw new Error("no box");
    await drag(
      page,
      { x: box.x + box.width / 2, y: box.y + 10 },
      { x: box.x + box.width / 2, y: box.y + 90 },
    );
    await expect(page.getByTestId("change-log")).toBeEmpty();
    await expect(locked.locator("[data-resize]")).toHaveCount(0);
  });

  test("picks a slot and a range with the keyboard", async ({ page }) => {
    const column = page.locator('[data-cell][tabindex="0"]');
    await column.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("create-log")).toHaveText(
      "2026-10-28T15:30:00.000Z|2026-10-28T16:00:00.000Z|false|keyboard",
    );

    await page.keyboard.press("Shift+ArrowDown");
    await page.keyboard.press("Shift+ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("create-log")).toHaveText(
      "2026-10-28T15:30:00.000Z|2026-10-28T17:00:00.000Z|false|keyboard",
    );

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator('[data-cell][tabindex="0"]')).toHaveAttribute(
      "aria-label",
      /Tuesday, October 27/,
    );
    await expect(page.locator('[data-cell][tabindex="0"]')).toBeFocused();
  });

  test("moves and resizes the focused event with the keyboard", async ({
    page,
  }) => {
    await lunch(page).focus();
    await page.keyboard.press("Alt+ArrowDown");
    await expect(page.getByTestId("change-log")).toHaveText(
      "lunch|move|2026-10-27T19:15:00.000Z|2026-10-27T20:15:00.000Z|keyboard",
    );
    await expect(lunch(page)).toBeFocused();

    await page.keyboard.press("Shift+ArrowDown");
    await expect(page.getByTestId("change-log")).toHaveText(
      "lunch|resize|2026-10-27T19:15:00.000Z|2026-10-27T20:30:00.000Z|keyboard",
    );

    await page.keyboard.press("Alt+ArrowRight");
    await expect(page.getByTestId("change-log")).toHaveText(
      "lunch|move|2026-10-28T19:15:00.000Z|2026-10-28T20:30:00.000Z|keyboard",
    );
    await expect(lunch(page)).toBeFocused();
  });

  test("moves between events with the arrow keys", async ({ page }) => {
    await page.getByRole("button", { name: /^Standup/ }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("button", { name: /^Design review/ }),
    ).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("button", { name: /^Roadmap sync/ }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("clicks")).toHaveText("1");
  });

  test("lists each day's events in a labeled group", async ({ page }) => {
    const tuesday = page.getByRole("group", {
      name: /^Tuesday, October 27, 2026/,
    });
    await expect(tuesday.getByRole("listitem")).toHaveCount(2);
  });
});

test.describe("Scheduler layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scheduler.html");
    await expect(lunch(page)).toBeVisible();
  });

  test("fits 20 overlapping events and 500 events in a week", async ({
    page,
  }) => {
    await page.goto("/scheduler.html?stress");
    await expect(
      page.getByRole("button", { name: /^Crowd 0,/ }),
    ).toBeAttached();
    const widths = await page
      .locator("[data-event-id^=crowd-]")
      .evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().width)),
      );
    expect(widths).toHaveLength(20);
    // 20 lanes in one column, each a positive width.
    expect(Math.min(...widths)).toBeGreaterThan(0);
    expect(await page.locator("[data-event-id]").count()).toBe(500);
  });

  test("shows a 25-hour day when the clocks fall back", async ({ page }) => {
    await page.goto("/scheduler.html?week=dst");
    await expect(
      page.getByRole("group", {
        name: /Sunday, November 1, 2026, 25 hour day/,
      }),
    ).toBeVisible();
  });

  test("starts the week on Monday in German and shows a 24-hour axis", async ({
    page,
  }) => {
    await page.goto("/scheduler.html?locale=de");
    const headings = await page
      .locator(".bx--scheduler__weekday")
      .allTextContents();
    expect(headings[0]).toMatch(/^Mo/);
    await expect(page.locator(".bx--scheduler__hour").nth(12)).toHaveText(
      /^13/,
    );
  });

  test("shows the first hour label whole below the header", async ({
    page,
  }) => {
    const head = await page.locator(".bx--scheduler__head").boundingBox();
    const label = await page
      .locator(".bx--scheduler__hour", { hasText: /^8 AM$/ })
      .boundingBox();
    if (!head || !label) throw new Error("no box");
    expect(label.y).toBeGreaterThanOrEqual(head.y + head.height - 0.5);
  });

  for (const view of ["week", "month"]) {
    test(`shows each ${view} time whole or not at all`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 800 });
      await page.goto(`/scheduler.html?view=${view}`);
      await expect(page.locator("[data-event-id]").first()).toBeVisible();
      const parts = await page
        .locator(".bx--scheduler__event-line > *")
        .evaluateAll((els) =>
          els.map((el) => {
            const box = el.getBoundingClientRect();
            const line = (el.parentElement as Element).getBoundingClientRect();
            return {
              shown: box.top < line.bottom - 0.5,
              inside:
                box.left >= line.left - 0.5 && box.right <= line.right + 0.5,
            };
          }),
        );
      expect(parts.length).toBeGreaterThan(0);
      expect(parts.filter((part) => part.shown && !part.inside)).toEqual([]);
    });
  }

  test("lays out the 12-hour axis in English", async ({ page }) => {
    await expect(page.locator(".bx--scheduler__hour").nth(12)).toHaveText(
      "1 PM",
    );
  });

  test("keeps events inside their columns in RTL", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const column = await page
      .locator("[data-cell][data-day]")
      .nth(2)
      .boundingBox();
    const event = await lunch(page).boundingBox();
    const first = await page
      .locator("[data-cell][data-day]")
      .nth(0)
      .boundingBox();
    if (!column || !event || !first) throw new Error("no box");
    // Sunday is on the right in RTL.
    expect(first.x).toBeGreaterThan(column.x);
    expect(event.x).toBeGreaterThanOrEqual(column.x - 1);
    expect(event.x + event.width).toBeLessThanOrEqual(
      column.x + column.width + 1,
    );
  });

  test("creates on the day under the pointer in RTL", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const box = await planeBox(page);
    // Sunday is on the right, so the second column from the right is Monday.
    const x = box.x + box.width * (1 - 1.5 / 7);
    await page.mouse.click(x, box.y + (box.height * 610) / 1440);
    await expect(page.getByTestId("create-log")).toHaveText(
      "2026-10-26T17:00:00.000Z|2026-10-26T17:30:00.000Z|false|pointer",
    );
  });

  test("gives event blocks a border in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const border = await lunch(page).evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        width: style.borderTopWidth,
        style: style.borderTopStyle,
        color: style.borderTopColor,
        background: style.backgroundColor,
      };
    });
    expect(border.width).toBe("1px");
    expect(border.style).toBe("solid");
    expect(border.color).not.toBe(border.background);
  });

  test("fits a narrow screen by scrolling the week sideways", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const scroller = page.locator(".bx--scheduler__scroller");
    const { client, scroll } = await scroller.evaluate((el) => ({
      client: el.clientWidth,
      scroll: el.scrollWidth,
    }));
    expect(scroll).toBeGreaterThan(client);
    const page_ = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(page_).toBeLessThanOrEqual(390);

    // Three whole days show, and a sideways scroll moves by a whole day
    // while the time axis stays.
    const cut = () =>
      scroller.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const axis = (
          el.querySelector(".bx--scheduler__axis") as Element
        ).getBoundingClientRect();
        return [...el.querySelectorAll("[data-cell][data-day]")]
          .map((column) => column.getBoundingClientRect())
          .filter(
            (column) =>
              column.right > axis.right + 1 && column.left < box.right - 1,
          )
          .map(
            (column) =>
              column.left < axis.right - 1 || column.right > box.right + 1,
          );
      });
    expect(await cut()).toEqual([false, false, false]);
    await scroller.evaluate((el) =>
      el.scrollBy({ left: 40, behavior: "instant" }),
    );
    await expect.poll(cut).toEqual([false, false, false]);
  });
});

test.describe("Scheduler month", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scheduler.html?view=month");
    await expect(page.getByRole("grid")).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("shows the month's weeks and its events", async ({ page }) => {
    await expect(page.getByRole("row")).toHaveCount(1 + 5);
    await expect(page.getByRole("button", { name: /^Offsite/ })).toBeVisible();
  });

  test("centers each weekday over the date numbers below it", async ({
    page,
  }) => {
    const centers = await page.evaluate(() => {
      const center = (el: Element) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const box = range.getBoundingClientRect();
        return (box.left + box.right) / 2;
      };
      const week = document.querySelector(".bx--scheduler__week") as Element;
      const dates = [...week.querySelectorAll(".bx--scheduler__date")];
      return [
        ...document.querySelectorAll(".bx--scheduler__month-heading"),
      ].map((heading, index) => center(dates[index]) - center(heading));
    });
    expect(centers).toHaveLength(7);
    for (const delta of centers) expect(Math.abs(delta)).toBeLessThan(0.5);
  });

  test("rings only the focused or selected cell in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.locator('[data-cell][tabindex="0"]').focus();
    const rings = await page
      .locator(".bx--scheduler__cell")
      .evaluateAll(
        (cells) =>
          cells.filter((cell) => getComputedStyle(cell).outlineStyle !== "none")
            .length,
      );
    expect(rings).toBe(1);
  });

  test("names each more link and keeps it on one line", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/scheduler.html?view=month&stress");
    const more = page.locator(".bx--scheduler__more").first();
    await expect(more).toHaveAccessibleName(
      /^\+\d+ more events on \w+day, October \d+, 2026$/,
    );
    const lines = await page
      .locator(".bx--scheduler__more")
      .evaluateAll((els) => els.map((el) => el.scrollHeight - el.clientHeight));
    expect(lines.length).toBeGreaterThan(0);
    expect(Math.max(...lines)).toBe(0);
  });

  test("keeps a timed event inside the cell of the day it starts", async ({
    page,
  }) => {
    // "Release night" runs from 10 PM to 2 AM.
    const outside = await page
      .locator(".bx--scheduler__event--chip")
      .evaluateAll((els) =>
        els.flatMap((el) => {
          const cell = (
            el.closest("[data-cell]") as Element
          ).getBoundingClientRect();
          const box = el.getBoundingClientRect();
          return box.left >= cell.left - 0.5 && box.right <= cell.right + 0.5
            ? []
            : [el.getAttribute("data-event-id")];
        }),
      );
    await expect(page.locator('[data-event-id="late"]')).toHaveCount(1);
    expect(outside).toEqual([]);
  });

  // A chip has no fill at rest, so on hover it takes the layer's hover fill.
  // The tag color's darker fill is for filled events.
  test("fills a hovered chip with the layer hover color", async ({ page }) => {
    const chip = page.locator(".bx--scheduler__event--chip").first();
    await chip.hover();
    const read = () =>
      chip.evaluate((el) => {
        const probe = document.createElement("span");
        probe.style.backgroundColor = "var(--cds-layer-hover)";
        document.body.append(probe);
        const layerHover = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return getComputedStyle(el).backgroundColor === layerHover;
      });
    await expect.poll(read).toBe(true);
  });

  test("creates an all-day range by dragging across days", async ({ page }) => {
    const box = await page.locator(".bx--scheduler__month-body").boundingBox();
    if (!box) throw new Error("no box");
    // October 2026 starts on a Thursday, so the fifth row is the week of Oct 25.
    const y = box.y + (box.height * 4.9) / 5;
    await drag(
      page,
      { x: box.x + (box.width * 4.5) / 7, y },
      { x: box.x + (box.width * 6.5) / 7, y },
    );
    await expect(page.getByTestId("create-log")).toHaveText(
      "2026-10-29T07:00:00.000Z|2026-11-01T07:00:00.000Z|true|pointer",
    );
  });

  test("moves a cell cursor with the arrow keys and opens a day", async ({
    page,
  }) => {
    const cell = page.locator('[data-cell][tabindex="0"]');
    await cell.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator('[data-cell][tabindex="0"]')).toHaveAttribute(
      "aria-label",
      /November 4/,
    );
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("create-log")).toHaveText(
      "2026-11-04T08:00:00.000Z|2026-11-05T08:00:00.000Z|true|keyboard",
    );
  });
});

// The clock is faked for a page load, which the shared host page skips.
baseTest.describe("Scheduler current time", () => {
  baseTest(
    "marks today and draws the time line at the current time",
    async ({ page }) => {
      // 11:35 in Los Angeles.
      await page.clock.install({ time: new Date("2026-10-27T18:35:00Z") });
      await page.goto("/scheduler.html");
      await expect(
        page.getByRole("group", { name: /Tuesday, October 27, 2026, today/ }),
      ).toBeVisible();
      const now = page.locator(".bx--scheduler__now");
      await expect(now).toHaveCount(1);
      const [line, plane] = await Promise.all([
        now.boundingBox(),
        planeBox(page),
      ]);
      if (!line) throw new Error("no line");
      expect((line.y - plane.y) / plane.height).toBeCloseTo(
        (11 * 60 + 35) / 1440,
        2,
      );

      await page.clock.fastForward(60_000);
      await expect(now).toHaveCount(1);
    },
  );
});
