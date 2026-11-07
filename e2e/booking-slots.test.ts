import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { expectNoNestedBorders, expectSingleRing } from "./helpers/layout";

const day = (page: Page, testId: string, name: string) =>
  page.getByTestId(testId).getByRole("gridcell", { name, exact: true });
const radios = (page: Page, testId: string) =>
  page.getByTestId(testId).getByRole("radio");

const NOV_11 = "Wednesday, November 11, 2026";

async function axe(page: Page, testId: string) {
  const results = await new AxeBuilder({ page })
    .include(`[data-testid=${testId}]`)
    .analyze();
  return results.violations;
}

test.describe("BookingSlots", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/booking-slots.html");
  });

  test("can be used with the keyboard alone", async ({ page }) => {
    // Narrow enough that the times wrap onto rows.
    await page.setViewportSize({ width: 420, height: 900 });
    const demo = page.getByTestId("demo");
    // The calendar's tab stop is today. Arrows take it to Wednesday.
    await day(page, "demo", "Saturday, November 7, 2026").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    await expect(demo.getByRole("radiogroup")).toHaveAccessibleName(
      "Available times on Wednesday, Nov 11",
    );

    // Tab leaves the calendar for the zone selector, then the times.
    await page.keyboard.press("Tab");
    await expect(
      demo.getByRole("combobox", { name: "Time zone" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    const first = radios(page, "demo").first();
    await expect(first).toBeFocused();
    await expect(first).toHaveText("9:00 AM");

    // The grid takes a row at a time with Up and Down.
    const perRow = await radios(page, "demo").evaluateAll((items) => {
      const top = (items[0] as HTMLElement).offsetTop;
      return items.filter((item) => (item as HTMLElement).offsetTop === top)
        .length;
    });
    expect(perRow).toBeGreaterThan(1);
    await page.keyboard.press("ArrowDown");
    await expect(radios(page, "demo").nth(perRow)).toBeFocused();
    await expect(radios(page, "demo").nth(perRow)).toBeChecked();
    await page.keyboard.press("ArrowUp");
    await expect(first).toBeChecked();
    await page.keyboard.press("ArrowRight");
    await expect(radios(page, "demo").nth(1)).toBeChecked();
    await expect(page.getByTestId("demo-value")).toHaveText(
      "2026-11-11T15:00:00.000Z",
    );

    // One tab stop: Tab leaves the grid.
    await page.keyboard.press("Tab");
    await expect(radios(page, "demo").nth(1)).not.toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(radios(page, "demo").nth(1)).toBeFocused();
  });

  test("jumps to the next available day before a day is chosen", async ({
    page,
  }) => {
    await expect(day(page, "demo", "Sunday, November 8, 2026")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    const button = page
      .getByTestId("demo")
      .getByRole("button", { name: /^Next available/ });
    await button.click();

    await expect(radios(page, "demo").first()).toBeFocused();
    await expect(
      page.getByTestId("demo").getByRole("radiogroup"),
    ).toHaveAccessibleName("Available times on Monday, Nov 9");
  });

  test("moves a slot to the next day when the zone passes midnight", async ({
    page,
  }) => {
    const demo = page.getByTestId("demo");
    await day(page, "demo", NOV_11).click();
    await demo.getByRole("radio", { name: "2:00 PM" }).click();
    await expect(page.getByTestId("demo-value")).toHaveText(
      "2026-11-11T19:00:00.000Z",
    );

    await demo
      .getByRole("combobox", { name: "Time zone" })
      .selectOption("Asia/Tokyo");

    await expect(page.getByTestId("demo-zone")).toHaveText("Asia/Tokyo");
    await expect(demo.getByRole("radiogroup")).toHaveAccessibleName(
      "Available times on Thursday, Nov 12",
    );
    await expect(demo.getByRole("radio", { name: "4:00 AM" })).toBeChecked();
    await expect(page.getByTestId("demo-value")).toHaveText(
      "2026-11-11T19:00:00.000Z",
    );
    await expect(demo.getByText("Times shown in Asia/Tokyo")).toBeVisible();
  });

  test("shows the day the clocks go back, with the hour twice", async ({
    page,
  }) => {
    const dst = page.getByTestId("dst");
    await expect(radios(page, "dst")).toHaveCount(25);
    await expect(dst.getByRole("radio", { name: "1:00 AM EDT" })).toBeVisible();
    await expect(dst.getByRole("radio", { name: "1:00 AM EST" })).toBeVisible();
    await expect(
      dst.getByRole("radio", { name: "2:00 AM", exact: true }),
    ).toBeVisible();

    await dst.getByRole("radio", { name: "1:00 AM EST" }).click();
    await expect(page.getByTestId("dst-value")).toHaveText(
      "2026-11-01T06:00:00.000Z",
    );
  });

  test("lays the slot grid out with more columns when there is room", async ({
    page,
  }) => {
    const columns = () =>
      radios(page, "demo").evaluateAll((items) => {
        const top = (items[0] as HTMLElement).offsetTop;
        return items.filter((item) => (item as HTMLElement).offsetTop === top)
          .length;
      });
    await day(page, "demo", NOV_11).click();
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect.poll(columns).toBeGreaterThanOrEqual(3);
    const wide = await columns();
    await page.setViewportSize({ width: 320, height: 900 });
    await expect.poll(columns).toBeLessThan(wide);
  });

  test("puts the calendar beside the times when wide and above them when narrow", async ({
    page,
  }) => {
    const demo = page.getByTestId("demo");
    await day(page, "demo", NOV_11).click();
    const boxes = async () => ({
      calendar: await demo
        .locator(".bx--booking-slots__calendar")
        .boundingBox(),
      times: await demo.locator(".bx--booking-slots__times").boundingBox(),
    });

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(async () => {
      const { calendar, times } = await boxes();
      expect(times?.x).toBeGreaterThanOrEqual(
        (calendar?.x ?? 0) + (calendar?.width ?? 0),
      );
      expect(times?.y).toBeCloseTo(calendar?.y ?? -1, 0);
    }).toPass();

    await page.setViewportSize({ width: 320, height: 900 });
    await expect(async () => {
      const { calendar, times } = await boxes();
      expect(times?.y).toBeGreaterThanOrEqual(
        (calendar?.y ?? 0) + (calendar?.height ?? 0),
      );
    }).toPass();
  });

  test("shows a loading state for a slow month and fetches the next ahead", async ({
    page,
  }) => {
    await page.goto("/booking-slots.html?delay=800");
    const async = page.getByTestId("async");

    await expect(async.getByText("Loading availability").first()).toBeVisible();
    await expect(day(page, "async", NOV_11)).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(async.locator(".bx--booking-slots")).toHaveAttribute(
      "aria-busy",
      "true",
    );

    await expect(day(page, "async", NOV_11)).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(async.locator(".bx--booking-slots")).not.toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(page.getByTestId("load-log")).toHaveText("2026-11,2026-12");

    // The next month was fetched ahead, so it opens without a wait. Showing
    // it fetches the one after.
    await async.getByRole("button", { name: "Next month" }).click();
    await expect(
      async.getByRole("grid", { name: "December 2026" }),
    ).toBeVisible();
    await expect(async.getByText("Loading availability")).toHaveCount(0);
    await expect(page.getByTestId("load-log")).toHaveText(
      "2026-11,2026-12,2027-01",
    );
  });

  test.describe("week view", () => {
    test("shows seven days of times side by side on a wide page", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      const week = page.getByTestId("week");
      await expect(week.locator(".bx--booking-slots__column")).toHaveCount(7);
      await expect(
        week.locator(".bx--booking-slots__column:visible"),
      ).toHaveCount(7);

      const tops = await week
        .locator(".bx--booking-slots__column:visible")
        .evaluateAll((columns) =>
          columns.map((column) =>
            Math.round(column.getBoundingClientRect().top),
          ),
        );
      expect(new Set(tops).size).toBe(1);
    });

    test("shows the chosen day alone on a narrow page", async ({ page }) => {
      await page.setViewportSize({ width: 600, height: 900 });
      const week = page.getByTestId("week");
      await expect(
        week.locator(".bx--booking-slots__column:visible"),
      ).toHaveCount(1);
    });

    test("moves between days with the arrow keys", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      const week = page.getByTestId("week");
      await week
        .getByRole("radiogroup")
        .nth(2)
        .getByRole("radio")
        .nth(1)
        .click();
      await expect(
        week.getByRole("radiogroup", {
          name: "Available times on Wednesday, Nov 11",
        }),
      ).toBeVisible();

      await page.keyboard.press("ArrowRight");
      await expect(
        week
          .getByRole("radiogroup", {
            name: "Available times on Thursday, Nov 12",
          })
          .getByRole("radio")
          .nth(1),
      ).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("ArrowLeft");
      await expect(
        week
          .getByRole("radiogroup", {
            name: "Available times on Tuesday, Nov 10",
          })
          .getByRole("radio")
          .nth(1),
      ).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(
        week
          .getByRole("radiogroup", {
            name: "Available times on Tuesday, Nov 10",
          })
          .getByRole("radio")
          .nth(2),
      ).toBeFocused();
    });
  });

  test.describe("a11y", () => {
    test("has no detectable violations with a day and a time chosen", async ({
      page,
    }) => {
      expect(await axe(page, "demo")).toEqual([]);
      await day(page, "demo", NOV_11).click();
      await page.getByTestId("demo").getByRole("radio").nth(2).click();
      // Let the fill finish fading in, or axe reads a color on its way.
      await page.waitForTimeout(400);
      expect(await axe(page, "demo")).toEqual([]);
      expect(await axe(page, "dst")).toEqual([]);
      expect(await axe(page, "week")).toEqual([]);
    });

    test("has none with no times, after a failed load, in Gray 100 or in RTL", async ({
      page,
    }) => {
      await day(page, "demo", NOV_11).click();
      await page.evaluate(() => {
        document.documentElement.setAttribute("theme", "g100");
        document.body.style.background = "var(--cds-background)";
      });
      await page.waitForTimeout(400);
      expect(await axe(page, "demo")).toEqual([]);
      await page.evaluate(() => {
        document.documentElement.removeAttribute("theme");
        document.body.style.background = "";
        document.documentElement.dir = "rtl";
      });
      await page.waitForTimeout(400);
      expect(await axe(page, "demo")).toEqual([]);
      expect(await axe(page, "week")).toEqual([]);
    });
  });

  test.describe("themes", () => {
    test("mirrors the layout and the arrow keys in a right-to-left page", async ({
      page,
    }) => {
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      await page.setViewportSize({ width: 1280, height: 900 });
      const demo = page.getByTestId("demo");
      await day(page, "demo", NOV_11).click();
      const calendar = await demo
        .locator(".bx--booking-slots__calendar")
        .boundingBox();
      const times = await demo
        .locator(".bx--booking-slots__times")
        .boundingBox();
      expect((times?.x ?? 0) + (times?.width ?? 0)).toBeLessThanOrEqual(
        calendar?.x ?? 0,
      );

      await radios(page, "demo").nth(1).focus();
      await page.keyboard.press("ArrowLeft");
      await expect(radios(page, "demo").nth(2)).toBeFocused();
    });

    test("fills the chosen time with Highlight under forced colors", async ({
      page,
      browserName,
    }) => {
      test.skip(browserName === "webkit", "WebKit does not force colors");
      await page.emulateMedia({ forcedColors: "active" });
      const demo = page.getByTestId("demo");
      await day(page, "demo", NOV_11).click();
      await radios(page, "demo").nth(1).click();
      // The fill fades in.
      await page.waitForTimeout(300);

      const [chosen, rest, highlight, buttonText] = await demo
        .getByRole("radio")
        .evaluateAll((items) => {
          const probe = document.createElement("div");
          document.body.append(probe);
          const color = (name: string) => {
            probe.style.color = name;
            return getComputedStyle(probe).color;
          };
          const result = [
            getComputedStyle(items[1]).backgroundColor,
            getComputedStyle(items[0]).backgroundColor,
            color("Highlight"),
            color("ButtonText"),
          ];
          probe.remove();
          return result;
        });
      expect(chosen).toBe(highlight);
      expect(rest).not.toBe(highlight);
      expect(buttonText).not.toBe(highlight);

      // The calendar is DateCalendar, which has its own checks.
      await expectNoNestedBorders(demo.locator(".bx--booking-slots__times"));
      // Focused and chosen are the same time: one ring.
      await radios(page, "demo").nth(1).focus();
      await expectSingleRing([demo.getByRole("radiogroup")]);
    });
  });
});
