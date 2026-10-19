import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// Opens every DatePicker docs example and checks the calendar's layout:
// nothing spills past the calendar, each day grid has seven columns under
// its weekday headings, and month/year grids span the calendar. Then scans
// the whole page, calendar included (popups attach to <body>), with axe.

/** Rules about the test page itself, which has no landmarks or heading. */
const PAGE_RULES = ["landmark-one-main", "page-has-heading-one", "region"];

// @depends-on docs/src/pages/framed/DatePicker/*.svelte
const EXAMPLES = readdirSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../docs/src/pages/framed/DatePicker",
  ),
)
  .filter((file) => file.endsWith(".svelte"))
  .map((file) => file.slice(0, -".svelte".length));

const CALENDAR = ".flatpickr-calendar.open, .flatpickr-calendar.inline";

const appears = (page: Page) =>
  page
    .locator(CALENDAR)
    .first()
    .waitFor({ timeout: 3000 })
    .then(() => true)
    .catch(() => false);

/** Opens the example's calendar: inline, from its input, or inside a dialog. */
async function openCalendar(page: Page) {
  const calendar = page.locator(CALENDAR).first();
  if (await calendar.isVisible()) return;

  const input = page.locator("#app input:visible").first();
  if (await input.count()) {
    await input.click();
    if (await appears(page)) return;
  }
  // Modal, dialog and popover examples open their container first. A modal
  // focuses its input, which already opens the calendar.
  await page.locator("#app button:visible").first().click();
  if (await appears(page)) return;
  await page.locator("input:visible").first().click();
}

function layoutProblems() {
  const problems: string[] = [];
  const TOLERANCE = 1;
  const rect = (el: Element) => el.getBoundingClientRect();
  const columns = (cells: Element[]) =>
    new Set(cells.map((cell) => Math.round(rect(cell).left))).size;

  for (const calendar of document.querySelectorAll(
    ".flatpickr-calendar.open, .flatpickr-calendar.inline",
  )) {
    const box = rect(calendar);
    for (const part of calendar.querySelectorAll(
      ".dayContainer, .flatpickr-weekwrapper, .flatpickr-weekdaycontainer, .flatpickr-monthSelect-months, .flatpickr-yearSelect-years, .flatpickr-prev-month, .flatpickr-next-month",
    )) {
      const partBox = rect(part);
      if (
        partBox.left < box.left - TOLERANCE ||
        partBox.right > box.right + TOLERANCE
      ) {
        problems.push(`${part.className} spills past the calendar`);
      }
    }

    const weekdays = calendar.querySelectorAll(".flatpickr-weekdaycontainer");
    calendar.querySelectorAll(".dayContainer").forEach((grid, index) => {
      const days = [...grid.querySelectorAll(".flatpickr-day")];
      if (columns(days) !== 7) {
        problems.push(`day grid ${index} has ${columns(days)} columns`);
      }
      const headings = [
        ...(weekdays[index]?.querySelectorAll(".flatpickr-weekday") ?? []),
      ];
      headings.forEach((heading, column) => {
        const center = (el: Element) => rect(el).left + rect(el).width / 2;
        if (Math.abs(center(heading) - center(days[column])) > TOLERANCE + 1) {
          problems.push(`weekday ${column} of grid ${index} is misaligned`);
        }
      });
    });

    for (const grid of calendar.querySelectorAll(
      ".flatpickr-monthSelect-months, .flatpickr-yearSelect-years",
    )) {
      const container = grid.parentElement;
      if (container && rect(grid).width < rect(container).width - 3) {
        problems.push(`${grid.className} does not span the calendar`);
      }
      // Months and years sit three to a row, quarters two.
      const expected = grid.classList.contains(
        "flatpickr-quarterSelect-quarters",
      )
        ? 2
        : 3;
      if (columns([...grid.children]) !== expected) {
        problems.push(`${grid.className} is not ${expected} columns`);
      }
    }

    if (calendar.scrollWidth > calendar.clientWidth + TOLERANCE) {
      problems.push("calendar overflows horizontally");
    }
    if (box.left < -TOLERANCE || box.right > innerWidth + TOLERANCE) {
      problems.push("calendar is off screen");
    }
  }
  return problems;
}

// The calendar stays left-to-right, as flatpickr's did, but the input and
// its positioning around it follow the page.
const RTL_EXAMPLES = [
  "DatePickerSingle",
  "DatePickerRange",
  "DatePickerMonth",
  "DatePickerWeekNumbers",
  "DatePickerInline",
  "DatePickerModal",
];

test.describe("DatePicker docs examples", () => {
  for (const [example, dir] of [
    ...EXAMPLES.map((name) => [name, "ltr"] as const),
    ...RTL_EXAMPLES.map((name) => [name, "rtl"] as const),
  ]) {
    test(`${example} (${dir}) lays out its calendar`, async ({ page }) => {
      await page.goto(
        `/date-picker-examples.html?example=${example}&dir=${dir}`,
      );
      await page.waitForSelector("body[data-ready]");
      await openCalendar(page);
      await expect(page.locator(CALENDAR).first()).toBeVisible();

      expect(await page.evaluate(layoutProblems)).toEqual([]);

      const { violations } = await new AxeBuilder({ page })
        .disableRules(PAGE_RULES)
        .analyze();
      expect(
        violations.map(({ id, nodes }) => `${id} (${nodes.length})`),
      ).toEqual([]);
    });
  }
});
