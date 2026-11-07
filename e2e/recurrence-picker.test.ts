import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { expectNoPageOverflow, expectSingleRing } from "./helpers/layout";

// A zone with daylight saving time on both dates the tests cross.
test.use({ timezoneId: "America/New_York" });

const picker = (page: Page, id: string) => page.getByTestId(id);
const preview = (page: Page, id: string) =>
  picker(page, id).locator(".bx--recurrence-picker__preview li");
const weekdays = (page: Page, id: string) =>
  picker(page, id)
    .getByRole("toolbar")
    .getByRole("button")
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("aria-label")));

test.beforeEach(async ({ page }) => {
  await page.goto("/recurrence-picker.html");
  await expect(picker(page, "rp-default")).toBeVisible();
});

test.describe("RecurrencePicker keyboard", () => {
  test("sets a weekly rule from the keyboard alone", async ({ page }) => {
    // Move along the weekday buttons and press one.
    const buttons = picker(page, "rp-default")
      .getByRole("toolbar")
      .getByRole("button");
    await buttons.filter({ hasText: "Tue" }).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");

    await expect(page.getByTestId("rp-value")).toHaveText(
      "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH,FR;WKST=SU",
    );
  });

  test("keeps one weekday pressed", async ({ page }) => {
    const buttons = picker(page, "rp-ar")
      .getByRole("toolbar")
      .getByRole("button");
    const pressed = buttons.and(page.locator("[aria-pressed=true]"));
    await expect(pressed).toHaveCount(1);
    await pressed.focus();
    await page.keyboard.press("Space");

    await expect(pressed).toHaveCount(1);
  });
});

test.describe("RecurrencePicker weeks", () => {
  test("starts the week on the locale's first day", async ({ page }) => {
    const [en, de, ar] = await Promise.all([
      weekdays(page, "rp-default"),
      weekdays(page, "rp-de"),
      weekdays(page, "rp-ar"),
    ]);

    expect(en[0]).toBe("Sunday");
    expect(de[0]).toBe("Montag");
    // The day names are Arabic; what matters is that the week starts on
    // Saturday there, so the seventh button is the Friday.
    const names = await page.evaluate(() => {
      const format = new Intl.DateTimeFormat("ar-EG", {
        weekday: "long",
        timeZone: "UTC",
      });
      return [6, 5].map((day) =>
        format.format(new Date(Date.UTC(2023, 0, 1 + day))),
      );
    });
    expect(ar[0]).toBe(names[0]);
    expect(ar[6]).toBe(names[1]);
  });

  test("writes the summary in the consumer's sentence", async ({ page }) => {
    await expect(
      picker(page, "rp-de").locator(".bx--recurrence-picker__summary"),
    ).toHaveText("Jede Woche am Montag und Mittwoch");
  });
});

test.describe("RecurrencePicker dates", () => {
  test("lists each day across the spring forward date once", async ({
    page,
  }) => {
    await expect(preview(page, "rp-march")).toHaveText([
      "Sat, Mar 7, 2026",
      "Sun, Mar 8, 2026",
      "Mon, Mar 9, 2026",
      "Tue, Mar 10, 2026",
    ]);
  });

  test("lists each day across the fall back date once", async ({ page }) => {
    await expect(preview(page, "rp-november")).toHaveText([
      "Sat, Oct 31, 2026",
      "Sun, Nov 1, 2026",
      "Mon, Nov 2, 2026",
      "Tue, Nov 3, 2026",
    ]);
  });

  test("repeats Feb 29 only in leap years", async ({ page }) => {
    await expect(preview(page, "rp-feb29")).toHaveText([
      "Thu, Feb 29, 2024",
      "Tue, Feb 29, 2028",
      "Sun, Feb 29, 2032",
    ]);
  });

  test("skips the months that have no 31st", async ({ page }) => {
    await expect(preview(page, "rp-31st")).toHaveText([
      "Sat, Jan 31, 2026",
      "Tue, Mar 31, 2026",
      "Sun, May 31, 2026",
      "Fri, Jul 31, 2026",
    ]);
  });
});

test.describe("RecurrencePicker in a Modal", () => {
  test("picks an end date from the calendar", async ({ page }) => {
    await page.getByTestId("rp-open").click();
    const modal = picker(page, "rp-modal");
    await modal.getByLabel("Repeat", { exact: true }).selectOption("DAILY");
    await modal.getByLabel("Ends").selectOption("until");

    await expect(page.getByTestId("rp-modal-value")).toHaveText(
      "FREQ=DAILY;UNTIL=20261110",
    );
    const input = modal.getByLabel("End date");
    await input.click();
    await expect(page.getByRole("grid").first()).toBeVisible();
    await page.getByRole("gridcell", { name: /November 20, 2026/ }).click();

    await expect(page.getByTestId("rp-modal-value")).toHaveText(
      "FREQ=DAILY;UNTIL=20261120",
    );
  });
});

test.describe("RecurrencePicker a11y and layout", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has none in Gray 100 and RTL", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
      document.body.style.background = "var(--cds-background)";
      document.documentElement.dir = "rtl";
    });
    // The theme change runs color transitions, and axe reads the colors.
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    );
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has none inside an open Modal", async ({ page }) => {
    await page.getByTestId("rp-open").click();
    await expect(page.locator(".bx--modal.is-visible")).toHaveCount(1);
    await expect
      .poll(() =>
        page
          .locator(".bx--modal-container")
          .evaluate(
            (node) =>
              getComputedStyle(node).backgroundColor +
              document.getAnimations().length,
          ),
      )
      .toBe("rgb(244, 244, 244)0");
    const results = await new AxeBuilder({ page })
      .include("[data-testid=rp-modal]")
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("fits a narrow page", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });

    await expectNoPageOverflow(page);
  });

  test("draws one focus ring under forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const select = picker(page, "rp-default").getByLabel("Repeat", {
      exact: true,
    });
    await select.focus();

    await expectSingleRing(picker(page, "rp-default").locator(".bx--select"));
  });
});
